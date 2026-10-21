// BOT Chain Network and Aura Finance Contract Definitions
// BOT Chain Testnet ChainID: 968 (0x3c8), RPC: https://rpc.bohr.life, Explorer: https://scan.bohr.life

export const BOTCHAIN_TESTNET = {
  chainId: 968,
  chainIdHex: '0x3c8',
  chainName: 'BOT Chain Testnet',
  rpcUrl: 'https://rpc.bohr.life',
  currency: {
    name: 'BOT',
    symbol: 'BOT',
    decimals: 18,
  },
  blockExplorer: 'https://scan.bohr.life',
  faucetUrl: 'https://faucet.botchain.ai/basic',
  docsUrl: 'https://dev-docs.botchain.ai/docs/intro',
};

export const BOTCHAIN_MAINNET = {
  chainId: 677,
  chainIdHex: '0x2a5',
  chainName: 'BOT Mainnet',
  rpcUrl: 'https://rpc.botchain.ai',
  currency: {
    name: 'BOT',
    symbol: 'BOT',
    decimals: 18,
  },
  blockExplorer: 'https://scan.botchain.ai',
};

// Default deployed contract addresses on BOT Chain Testnet
// (Can be overridden via NEXT_PUBLIC_VAULT_ADDRESS and NEXT_PUBLIC_TOKEN_ADDRESS)
export const CONTRACT_ADDRESSES = {
  testnet: {
    vault: process.env.NEXT_PUBLIC_VAULT_ADDRESS || '0x49486a845493bEC2CB320598EC4d1fEb11e1F546',
    aBtcToken: process.env.NEXT_PUBLIC_TOKEN_ADDRESS || '0x017D10E6FF87bBA10a7C24f5eC1dC627AC4e5698',
  },
};

export const AURA_VAULT_ABI = [
  'function deposit() external payable',
  'function mint(uint256 amountToMint) external',
  'function repay(uint256 amountToRepay) external',
  'function withdraw(uint256 amount) external',
  'function getBalance(address user) external view returns (uint256)',
  'function getDebt(address user) external view returns (uint256)',
  'function getMaxBorrowable(address user) external view returns (uint256)',
  'function calculateMaxBorrowable(address user) external view returns (uint256)',
  'function getCollateralValueUsd(address user) external view returns (uint256)',
  'function getVaultStats() external view returns (uint256 totalDeposited, uint256 totalDebt, uint256 ltvBps, uint256 botPriceUsd, uint256 abtcPriceUsd)',
  'function botDeposits(address) external view returns (uint256)',
  'function debt(address) external view returns (uint256)',
  'function totalBotDeposited() external view returns (uint256)',
  'function totalDebt() external view returns (uint256)',
  'function LTV_BPS() external view returns (uint256)',
  'function BOT_PRICE_USD() external view returns (uint256)',
  'function ABTC_PRICE_USD() external view returns (uint256)',
  'event Deposited(address indexed user, uint256 amount)',
  'event Minted(address indexed user, uint256 amount)',
  'event Repaid(address indexed user, uint256 amount)',
  'event Withdrawn(address indexed user, uint256 amount)',
];

export const AURA_TOKEN_ABI = [
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function totalSupply() external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) external returns (bool)',
  'function mint(address to, uint256 amount) external returns (bool)',
  'function burn(address from, uint256 amount) external returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
];
