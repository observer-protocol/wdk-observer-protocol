const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying contracts with account:', deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log('Account balance:', hre.ethers.formatEther(balance), 'CELO');

  // cUSD token address on Celo Sepolia testnet
  // Using a placeholder - update with actual cUSD address on Celo Sepolia
  const cUSD_ADDRESS = '0x2F25deB3848C207fc8E0c34035B3Ba7f1579A842';

  // Deploy AgentIdentityRegistry
  console.log('\nDeploying AgentIdentityRegistry...');
  const AgentIdentityRegistry = await hre.ethers.getContractFactory('AgentIdentityRegistry');
  const identityRegistry = await AgentIdentityRegistry.deploy();
  await identityRegistry.waitForDeployment();
  const identityAddress = await identityRegistry.getAddress();
  console.log('AgentIdentityRegistry deployed to:', identityAddress);

  // Deploy AgentReputationRegistry
  console.log('\nDeploying AgentReputationRegistry...');
  const AgentReputationRegistry = await hre.ethers.getContractFactory('AgentReputationRegistry');
  const reputationRegistry = await AgentReputationRegistry.deploy();
  await reputationRegistry.waitForDeployment();
  const reputationAddress = await reputationRegistry.getAddress();
  console.log('AgentReputationRegistry deployed to:', reputationAddress);

  // Deploy AgentStaking
  console.log('\nDeploying AgentStaking...');
  const AgentStaking = await hre.ethers.getContractFactory('AgentStaking');
  const staking = await AgentStaking.deploy(cUSD_ADDRESS);
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log('AgentStaking deployed to:', stakingAddress);

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: Number(await hre.ethers.provider.getNetwork().then(n => n.chainId)),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      AgentIdentityRegistry: {
        address: identityAddress,
        txHash: identityRegistry.deploymentTransaction().hash
      },
      AgentReputationRegistry: {
        address: reputationAddress,
        txHash: reputationRegistry.deploymentTransaction().hash
      },
      AgentStaking: {
        address: stakingAddress,
        txHash: staking.deploymentTransaction().hash
      }
    },
    tokens: {
      cUSD: cUSD_ADDRESS
    }
  };

  const addressesPath = path.join(__dirname, '..', 'deployed-addresses.json');
  fs.writeFileSync(addressesPath, JSON.stringify(deploymentInfo, null, 2));
  console.log('\nDeployment info saved to:', addressesPath);

  // Update .env file with deployed addresses
  const envPath = path.join(__dirname, '..', '.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  envContent = envContent.replace(
    /AGENT_IDENTITY_REGISTRY_ADDRESS=.*/,
    `AGENT_IDENTITY_REGISTRY_ADDRESS=${identityAddress}`
  );
  envContent = envContent.replace(
    /AGENT_REPUTATION_REGISTRY_ADDRESS=.*/,
    `AGENT_REPUTATION_REGISTRY_ADDRESS=${reputationAddress}`
  );
  envContent = envContent.replace(
    /AGENT_STAKING_ADDRESS=.*/,
    `AGENT_STAKING_ADDRESS=${stakingAddress}`
  );
  
  fs.writeFileSync(envPath, envContent);
  console.log('.env file updated with deployed addresses');

  console.log('\n✅ All contracts deployed successfully!');
  console.log('\nContract Addresses:');
  console.log('  AgentIdentityRegistry:', identityAddress);
  console.log('  AgentReputationRegistry:', reputationAddress);
  console.log('  AgentStaking:', stakingAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
