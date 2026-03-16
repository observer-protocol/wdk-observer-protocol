require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 31337
    },
    'celo-sepolia': {
      url: 'https://forno.celo-sepolia.celo-testnet.org',
      accounts: process.env.CELO_PRIVATE_KEY ? [process.env.CELO_PRIVATE_KEY] : [],
      chainId: 11142220
    },
    'celo-mainnet': {
      url: process.env.CELO_MAINNET_RPC || 'https://forno.celo.org',
      accounts: process.env.CELO_PRIVATE_KEY ? [process.env.CELO_PRIVATE_KEY] : [],
      chainId: 42220
    }
  },
  etherscan: {
    apiKey: {
      alfajores: process.env.CELOSCAN_API_KEY || '',
      celo: process.env.CELOSCAN_API_KEY || ''
    },
    customChains: [
      {
        network: 'alfajores',
        chainId: 44787,
        urls: {
          apiURL: 'https://api-alfajores.celoscan.io/api',
          browserURL: 'https://alfajores.celoscan.io'
        }
      },
      {
        network: 'celo',
        chainId: 42220,
        urls: {
          apiURL: 'https://api.celoscan.io/api',
          browserURL: 'https://celoscan.io'
        }
      }
    ]
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts'
  }
};
