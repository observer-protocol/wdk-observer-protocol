const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying AgentStaking with account:', deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log('Account balance:', hre.ethers.formatEther(balance), 'CELO');

  // cUSD (USDm) token address on Celo Sepolia testnet
  const cUSD_ADDRESS = '0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b';

  // Deploy AgentStaking
  console.log('\nDeploying AgentStaking...');
  const AgentStaking = await hre.ethers.getContractFactory('AgentStaking');
  const staking = await AgentStaking.deploy(cUSD_ADDRESS);
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log('AgentStaking deployed to:', stakingAddress);

  console.log('\n✅ AgentStaking deployed successfully!');
  console.log('Contract Address:', stakingAddress);
  console.log('Transaction Hash:', staking.deploymentTransaction().hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
