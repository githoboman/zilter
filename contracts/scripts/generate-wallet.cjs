const fs = require('fs');
const path = require('path');
const { ethers } = require('../../frontend/node_modules/ethers');

const RPC_URL = 'https://rpc.bohr.life';
const CHAIN_ID = 968;
const FAUCET_URL = 'https://faucet.botchain.ai/basic';
const EXPLORER_URL = 'https://scan.bohr.life';

async function main() {
  const envPath = path.join(__dirname, '..', '.env');
  const provider = new ethers.JsonRpcProvider(RPC_URL, {
    chainId: CHAIN_ID,
    name: 'botchain-testnet',
  }, { staticNetwork: true });

  let wallet;
  let isNew = false;

  // Check if .env exists with PRIVATE_KEY
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/PRIVATE_KEY=(0x[a-fA-F0-9]{64})/);
    if (match) {
      wallet = new ethers.Wallet(match[1], provider);
    }
  }

  if (!wallet) {
    wallet = ethers.Wallet.createRandom(provider);
    isNew = true;
    const envData = `PRIVATE_KEY=${wallet.privateKey}\nDEPLOYER_ADDRESS=${wallet.address}\nBOTCHAIN_RPC=${RPC_URL}\nBOTCHAIN_CHAIN_ID=${CHAIN_ID}\n`;
    fs.writeFileSync(envPath, envData);
  } else {
    wallet = wallet.connect(provider);
  }

  const currentBlock = await provider.getBlockNumber();
  const balanceWei = await provider.getBalance(wallet.address);
  const balanceFormatted = ethers.formatEther(balanceWei);

  console.log('====================================================');
  console.log('       BOT Chain Testnet Deployment Wallet          ');
  console.log('====================================================');
  if (isNew) {
    console.log('✨ NEW Wallet Generated and saved to contracts/.env');
  } else {
    console.log('📁 Existing Wallet Loaded from contracts/.env');
  }
  console.log(`\n📌 Wallet Address:   ${wallet.address}`);
  console.log(`🔑 Private Key:      ${wallet.privateKey}`);
  console.log(`🌐 Network:          BOT Chain Testnet (Chain ID: ${CHAIN_ID})`);
  console.log(`🧱 Current Block:    #${currentBlock}`);
  console.log(`💰 Live Balance:     ${balanceFormatted} BOT`);
  console.log(`🔍 BOTScan:          ${EXPLORER_URL}/address/${wallet.address}`);
  console.log('====================================================');

  if (parseFloat(balanceFormatted) >= 0.05) {
    console.log('✅ Wallet has sufficient funds for deployment!');
    console.log('Run the deployment command:');
    console.log('  node contracts/scripts/deploy-botchain.cjs');
  } else {
    console.log('⚠️  Wallet is NOT funded yet.');
    console.log(`👉 Claim free tBOT tokens from the official faucet:`);
    console.log(`   ${FAUCET_URL}`);
    console.log(`   (Paste wallet address: ${wallet.address})`);
    console.log('\nOnce funded, re-run this script to verify balance or run:');
    console.log('  node contracts/scripts/deploy-botchain.cjs');
  }
  console.log('====================================================');
}

main().catch((err) => {
  console.error('Wallet generation error:', err);
  process.exit(1);
});
