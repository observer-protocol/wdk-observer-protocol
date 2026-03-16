/**
 * MCP Server for WDK + Observer Protocol
 * 
 * Exposes wallet and identity tools via Model Context Protocol
 * for integration with Claude Code and other MCP clients.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { AgentWallet } from './agent-wallet.mjs';

export function createMcpServer(options = {}) {
  const wallet = options.agentWallet || new AgentWallet(options);
  
  const server = new Server(
    {
      name: 'wdk-observer-protocol',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Define available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'get_wallet_balance',
          description: 'Get wallet balance for a specific blockchain',
          inputSchema: {
            type: 'object',
            properties: {
              chain: {
                type: 'string',
                description: 'Blockchain to check (bitcoin, ethereum, polygon)',
                enum: ['bitcoin', 'ethereum', 'polygon']
              },
              token: {
                type: 'string',
                description: 'Token symbol for EVM chains (e.g., USDT)',
                optional: true
              }
            },
            required: ['chain']
          }
        },
        {
          name: 'verify_agent_identity',
          description: 'Verify an agent\'s identity via Observer Protocol',
          inputSchema: {
            type: 'object',
            properties: {
              alias: {
                type: 'string',
                description: 'Agent alias to verify'
              }
            },
            required: ['alias']
          }
        },
        {
          name: 'verified_send',
          description: 'Verify recipient identity and then send payment',
          inputSchema: {
            type: 'object',
            properties: {
              recipientAlias: {
                type: 'string',
                description: 'Observer Protocol alias of recipient'
              },
              amount: {
                type: 'string',
                description: 'Amount to send'
              },
              chain: {
                type: 'string',
                description: 'Blockchain to use',
                enum: ['bitcoin', 'ethereum', 'polygon']
              },
              token: {
                type: 'string',
                description: 'Token for EVM chains (e.g., USDT)',
                optional: true
              }
            },
            required: ['recipientAlias', 'amount', 'chain']
          }
        },
        {
          name: 'register_agent',
          description: 'Register a new agent identity with Observer Protocol',
          inputSchema: {
            type: 'object',
            properties: {
              alias: {
                type: 'string',
                description: 'Human-readable agent alias'
              },
              publicKeyHash: {
                type: 'string',
                description: 'SHA256 hash of agent public key'
              },
              metadata: {
                type: 'object',
                description: 'Optional metadata about the agent',
                optional: true
              }
            },
            required: ['alias', 'publicKeyHash']
          }
        },
        {
          name: 'get_agent_reputation',
          description: 'Get reputation score and verification history for an agent',
          inputSchema: {
            type: 'object',
            properties: {
              alias: {
                type: 'string',
                description: 'Agent alias to check'
              }
            },
            required: ['alias']
          }
        },
        {
          name: 'check_recipient',
          description: 'Quick check if a recipient is verified (without payment)',
          inputSchema: {
            type: 'object',
            properties: {
              alias: {
                type: 'string',
                description: 'Agent alias to check'
              }
            },
            required: ['alias']
          }
        },
        {
          name: 'get_network_stats',
          description: 'Get Observer Protocol network statistics',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        }
      ]
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      let result;

      switch (name) {
        case 'get_wallet_balance':
          result = await wallet.getVerifiedBalance(args.chain, args.token);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ]
          };

        case 'verify_agent_identity':
          result = await wallet.checkRecipient(args.alias);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ]
          };

        case 'verified_send':
          result = await wallet.verifiedSend({
            recipientAlias: args.recipientAlias,
            amount: args.amount,
            chain: args.chain,
            token: args.token
          });
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ]
          };

        case 'register_agent':
          result = await wallet.register({
            alias: args.alias,
            publicKeyHash: args.publicKeyHash,
            metadata: args.metadata
          });
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ]
          };

        case 'get_agent_reputation':
          result = await wallet.getAgentReputation(args.alias);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ]
          };

        case 'check_recipient':
          result = await wallet.checkRecipient(args.alias);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ]
          };

        case 'get_network_stats':
          result = await wallet.getNetworkStats();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ]
          };

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  });

  return server;
}

// Start server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  
  console.error('Starting WDK + Observer Protocol MCP Server...');
  
  server.connect(transport).then(() => {
    console.error('MCP Server running on stdio');
  }).catch((error) => {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  });
}

export default createMcpServer;
