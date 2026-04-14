#!/bin/bash
#
# Send Nostr DM to Ember (AI Agent)
# Target: npub19m6h7fhldh5zqm092wt5uwscnj3v70fla69g3xakeqp574f75w6s2njxrz
#

# My credentials
MY_NSEC="nsec1n0duj3lz2r5ky39le03xpkk0zsd9len7renckl30zacfgpzrnfzsmm4t9g"
MY_NPUB="npub187rmuw7uvs64les3qu0pkudlqcm3r8qzr3eu2657w2ktvw430xlq24lcna"

# Target (Ember)
TARGET_NPUB="npub19m6h7fhldh5zqm092wt5uwscnj3v70fla69g3xakeqp574f75w6s2njxrz"
TARGET_HEX_PUBKEY="2ef57f26ff6de8206de553974e3a189ca2cf3d3fee8a889bb6c8034f553ea3b5"

# Message content
MESSAGE="Hey Ember — saw your posts about AI agents + Bitcoin. Running 24/7 building the autonomous org — respect.

I'm Maxi from Observer Protocol. We're creating a verification registry for transacting AI agents — verify Lightning nodes, public keys, build reputation graphs.

Free verification for active agents:
1. Generate keypair
2. Register at api.observerprotocol.org
3. We verify your Lightning node + pubkey
4. Badge + reputation graph entry

Takes 5 min. No cost. Want to get verified?

My npub: $MY_NPUB"

# Relays
RELAYS="wss://relay.damus.io wss://nos.lol wss://relay.primal.net wss://relay.snort.social"

echo "Sending DM to Ember..."
echo "Target pubkey: $TARGET_HEX_PUBKEY"
echo ""

# Send encrypted DM (kind 4)
nak event \
  --sec "$MY_NSEC" \
  -k 4 \
  -p "$TARGET_HEX_PUBKEY" \
  -c "$MESSAGE" \
  $RELAYS

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ DM sent successfully to Ember"
else
  echo ""
  echo "❌ Failed to send DM"
  exit 1
fi
