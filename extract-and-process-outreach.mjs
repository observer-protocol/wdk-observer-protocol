#!/usr/bin/env node
/**
 * extract-and-merge-outreach.mjs — Extract and merge both outreach_log arrays, then process
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTREACH_FILE = join(__dirname, 'verification-outreach.json');
const BACKUP_FILE = join(__dirname, 'verification-outreach-backup.json');

console.log(`\n📋 Observer Protocol Outreach Extraction & Merge`);
console.log(`═══════════════════════════════════════════════\n`);

// Read the raw file
const rawContent = readFileSync(OUTREACH_FILE, 'utf8');
console.log(`✓ Read ${rawContent.length} bytes`);

// Create backup
writeFileSync(BACKUP_FILE, rawContent);
console.log(`✓ Created backup\n`);

// Extract both outreach_log arrays
// First outreach_log: from "outreach_log": [ to the matching ]
const extractArrays = (content) => {
  const arrays = [];
  let pos = 0;
  
  while (true) {
    const startIdx = content.indexOf('"outreach_log":', pos);
    if (startIdx === -1) break;
    
    const bracketStart = content.indexOf('[', startIdx);
    if (bracketStart === -1) break;
    
    // Find matching closing bracket
    let depth = 1;
    let endIdx = bracketStart + 1;
    while (depth > 0 && endIdx < content.length) {
      if (content[endIdx] === '[') depth++;
      if (content[endIdx] === ']') depth--;
      endIdx++;
    }
    
    if (depth === 0) {
      const arrayContent = content.substring(bracketStart, endIdx);
      try {
        const parsed = JSON.parse(arrayContent);
        arrays.push(...parsed);
        console.log(`✓ Extracted ${parsed.length} entries from array at position ${startIdx}`);
      } catch (e) {
        console.log(`⚠️  Failed to parse array at position ${startIdx}: ${e.message}`);
      }
    }
    
    pos = endIdx;
  }
  
  return arrays;
};

const allEntries = extractArrays(rawContent);
console.log(`\n📊 Total entries extracted: ${allEntries.length}`);

// Count status types
const statusCounts = {};
for (const entry of allEntries) {
  const status = entry.status || 'unknown';
  statusCounts[status] = (statusCounts[status] || 0) + 1;
}
console.log('\nStatus breakdown:');
for (const [status, count] of Object.entries(statusCounts)) {
  console.log(`  ${status}: ${count}`);
}

// Get pending entries
const pendingEntries = allEntries.filter(e => e.status === 'pending_github_auth');
console.log(`\n🔄 Found ${pendingEntries.length} entries with "pending_github_auth" status`);

if (pendingEntries.length === 0) {
  console.log('✅ No pending entries to process.');
  process.exit(0);
}

// Verify gh CLI
console.log('\n🔐 Checking GitHub CLI authentication...');
try {
  const status = execSync('gh auth status', { encoding: 'utf8', stdio: 'pipe' });
  console.log('✓ GitHub CLI is authenticated\n');
} catch (e) {
  console.error('✗ GitHub CLI not authenticated. Run: gh auth login');
  process.exit(1);
}

// Process entries
let processed = 0;
let failed = 0;
let skipped = 0;

for (const entry of allEntries) {
  if (entry.status !== 'pending_github_auth') continue;

  // Extract repo
  const match = entry.contact_method.match(/GitHub issue pending - ([^\s]+)/);
  if (!match) {
    console.log(`⏭️  Skipping ${entry.agent_name}: No repo found`);
    skipped++;
    continue;
  }

  const repo = match[1];
  console.log(`\n📤 ${entry.agent_name}`);
  console.log(`   Repo: ${repo}`);

  const title = `Observer Protocol: Free Verification for ${entry.agent_name}`;
  const body = generateIssueBody(entry);

  try {
    const result = execSync(
      `gh issue create --repo "${repo}" --title "${escapeShellArg(title)}" --body "${escapeShellArg(body)}"`,
      { encoding: 'utf8', stdio: 'pipe', timeout: 30000 }
    );

    const issueUrl = result.trim();
    console.log(`   ✅ ${issueUrl}`);

    entry.status = 'sent';
    entry.response = issueUrl;
    entry.response_date = new Date().toISOString().split('T')[0];
    processed++;

    await sleep(1500);

  } catch (error) {
    const errorMsg = error.stderr || error.message || 'Unknown error';
    const firstLine = errorMsg.split('\n')[0];
    console.log(`   ❌ ${firstLine}`);
    
    if (errorMsg.includes('not found') || errorMsg.includes('404')) {
      entry.status = 'failed_repo_not_found';
    } else if (errorMsg.includes('already exists')) {
      entry.status = 'failed_duplicate';
    } else {
      entry.status = 'failed';
    }
    entry.response = firstLine;
    entry.response_date = new Date().toISOString().split('T')[0];
    failed++;
    
    await sleep(1000);
  }
}

// Write clean output
const output = {
  created: "2026-03-15T02:00:00Z",
  updated: new Date().toISOString(),
  outreach_log: allEntries
};

writeFileSync(OUTREACH_FILE, JSON.stringify(output, null, 2));

console.log(`\n${'═'.repeat(50)}`);
console.log(`✅ Processed: ${processed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`⏭️  Skipped: ${skipped}`);
console.log(`\n📝 Updated verification-outreach.json`);
console.log(`💾 Backup: verification-outreach-backup.json`);

// Helper functions
function generateIssueBody(entry) {
  return `Hi there! 👋

I'm reaching out from [Observer Protocol](https://observerprotocol.org) — a universal verification layer for AI agents handling real money.

**Why I'm contacting you:**
We identified **${entry.agent_name}** as a significant project in the agentic payments ecosystem. We'd love to offer you **free verification** through our protocol.

**What this gives you:**
- 🔐 Cryptographic proof of agent identity (DID-based)
- ✅ Verifiable Agent Credentials (VAC) — "this agent is legit"
- 📊 Transaction attestation on public ledger (Bitcoin/LN)
- 🌐 Cross-chain rails: x402, Lightning, Solana, EVM

**Zero cost. No integration required.**

We can create a verified profile for your agent based on publicly available information. Just reply here or email us at verify@observerprotocol.org

---
*This is an automated outreach from the Observer Protocol team. If you received this in error, please accept our apologies and close this issue.*`;
}

function escapeShellArg(arg) {
  return arg.replace(/"/g, '\\"').replace(/\$/g, '\\$').replace(/`/g, '\\`');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
