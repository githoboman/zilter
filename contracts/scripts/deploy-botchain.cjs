const fs = require('fs');
const path = require('path');
const { ethers } = require('../../frontend/node_modules/ethers');

const RPC_URL = 'https://rpc.bohr.life';
const CHAIN_ID = 968;
const EXPLORER_URL = 'https://scan.bohr.life';

async function main() {
  console.log('====================================================');
  console.log('  Aura Finance - BOT Chain Testnet Deployment');
  console.log('====================================================');
  console.log('Connecting to BOT Chain Testnet at:', RPC_URL);

  const provider = new ethers.JsonRpcProvider(RPC_URL, {
    chainId: CHAIN_ID,
    name: 'botchain-testnet',
  }, { staticNetwork: true });

  const currentBlock = await provider.getBlockNumber();
  console.log(`Current Block on BOT Chain Testnet: #${currentBlock}`);

  let privateKey = process.env.PRIVATE_KEY;
  const envPath = path.join(__dirname, '..', '.env');
  if (!privateKey && fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/PRIVATE_KEY=(0x[a-fA-F0-9]{64})/);
    if (match) {
      privateKey = match[1];
      console.log('Loaded PRIVATE_KEY from contracts/.env');
    }
  }

  if (!privateKey) {
    console.error('\n❌ ERROR: PRIVATE_KEY not set and no contracts/.env found.');
    console.log('Generate a deployment wallet first by running:');
    console.log('  node contracts/scripts/generate-wallet.cjs');
    process.exit(1);
  }

  const wallet = new ethers.Wallet(privateKey, provider);
  const balanceWei = await provider.getBalance(wallet.address);
  const balanceBot = ethers.formatEther(balanceWei);

  console.log(`Deployer Address: ${wallet.address}`);
  console.log(`Deployer Balance: ${balanceBot} BOT`);

  if (parseFloat(balanceBot) < 0.05) {
    console.error(`\n❌ ERROR: Insufficient BOT balance (${balanceBot} BOT).`);
    console.log(`Please claim free testnet BOT at: https://faucet.botchain.ai/basic`);
    console.log(`Send tokens to: ${wallet.address}`);
    process.exit(1);
  }

  // Load ABI & Bytecode
  const contractsDir = path.join(__dirname, '..', '..', 'frontend', 'src', 'contracts');
  const tokenArtifactPath = path.join(contractsDir, 'AuraToken.json');
  const vaultArtifactPath = path.join(contractsDir, 'AuraVault.json');

  if (!fs.existsSync(tokenArtifactPath) || !fs.existsSync(vaultArtifactPath)) {
    console.log('Compiled artifacts not found. Please run: node contracts/scripts/compile.cjs');
    process.exit(1);
  }

  const tokenArtifact = JSON.parse(fs.readFileSync(tokenArtifactPath, 'utf8'));
  const vaultArtifact = JSON.parse(fs.readFileSync(vaultArtifactPath, 'utf8'));

  console.log('\n1. Deploying AuraToken (aBTC synthetic token)...');
  const TokenFactory = new ethers.ContractFactory(tokenArtifact.abi, tokenArtifact.bytecode, wallet);
  const tokenContract = await TokenFactory.deploy();
  await tokenContract.waitForDeployment();
  const tokenAddress = await tokenContract.getAddress();
  console.log(`✅ AuraToken deployed at: ${tokenAddress}`);
  console.log(`   View on BOTScan: ${EXPLORER_URL}/address/${tokenAddress}`);

  console.log('\n2. Deploying AuraVault (CDP Collateral & Minting Vault)...');
  const VaultFactory = new ethers.ContractFactory(vaultArtifact.abi, vaultArtifact.bytecode, wallet);
  const vaultContract = await VaultFactory.deploy(tokenAddress);
  await vaultContract.waitForDeployment();
  const vaultAddress = await vaultContract.getAddress();
  console.log(`✅ AuraVault deployed at: ${vaultAddress}`);
  console.log(`   View on BOTScan: ${EXPLORER_URL}/address/${vaultAddress}`);

  console.log('\n3. Authorizing AuraVault as Minter on AuraToken...');
  const setVaultTx = await tokenContract.setVault(vaultAddress);
  await setVaultTx.wait(1);
  console.log(`✅ AuraVault authorized as minter (tx: ${setVaultTx.hash})`);

  // Write deployment info
  const deploymentInfo = {
    network: 'BOT Chain Testnet',
    chainId: CHAIN_ID,
    rpcUrl: RPC_URL,
    deployer: wallet.address,
    contracts: {
      auraToken: tokenAddress,
      auraVault: vaultAddress,
    },
    deployedAt: new Date().toISOString(),
    explorer: {
      auraToken: `${EXPLORER_URL}/address/${tokenAddress}`,
      auraVault: `${EXPLORER_URL}/address/${vaultAddress}`,
    },
  };

  const deploymentPath = path.join(__dirname, '..', 'deployments', 'botchain-testnet.json');
  fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

  // Auto-update frontend/.env.local so frontend picks up new contracts immediately
  const envLocalPath = path.join(__dirname, '..', '..', 'frontend', '.env.local');
  fs.writeFileSync(
    envLocalPath,
    `NEXT_PUBLIC_VAULT_ADDRESS=${vaultAddress}\nNEXT_PUBLIC_TOKEN_ADDRESS=${tokenAddress}\n`
  );

  console.log('\n====================================================');
  console.log('  Deployment Complete!');
  console.log(`  Saved to: contracts/deployments/botchain-testnet.json`);
  console.log(`  Saved to: frontend/.env.local`);
  console.log('====================================================');
}

main().catch((err) => {
  console.error('\nDeployment failed:', err);
  process.exit(1);
});
