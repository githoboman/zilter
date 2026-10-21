const { ethers } = require('ethers');

const RPC_URL = 'https://rpc.bohr.life';
const CHAIN_ID = 968;

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL, {
    chainId: CHAIN_ID,
    name: 'botchain-testnet',
  });

  console.log('Connecting to BOT Chain Testnet at', RPC_URL);
  const blockNumber = await provider.getBlockNumber();
  console.log('Current block number on BOT Chain Testnet:', blockNumber);

  // Check if private key provided in env
  const privateKey = process.env.PRIVATE_KEY;
  if (privateKey) {
    const wallet = new ethers.Wallet(privateKey, provider);
    const balance = await provider.getBalance(wallet.address);
    console.log('Using configured wallet:', wallet.address);
    console.log('Balance:', ethers.formatEther(balance), 'BOT');
  } else {
    // Generate a random wallet for testnet use
    const newWallet = ethers.Wallet.createRandom();
    console.log('Generated deployment wallet:');
    console.log('Address:', newWallet.address);
    console.log('Private Key:', newWallet.privateKey);
    console.log('Faucet URL to claim tBOT:', 'https://faucet.botchain.ai/basic');
  }
}

main().catch(console.error);
