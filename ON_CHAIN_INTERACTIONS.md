# Aura Finance — On-Chain Interaction Records
**Official Verification & Evidence Package for BOT Chain Ecosystem Support Program**

*Network: BOT Chain Testnet (Chain ID: 968)*  
*Explorer: [https://scan.bohr.life](https://scan.bohr.life)*  
*Timestamp: October 21, 2026*  

---

## 1. Executive Summary of On-Chain Proofs
Aura Finance has successfully deployed its complete Collateralized Debt Position (CDP) protocol natively to **BOT Chain Testnet**. All contracts have been executed, wired, and verified on-chain via the official RPC (`https://rpc.bohr.life`).

This document provides verifiable explorer URLs, transaction hashes, smart contract addresses, and execution logs demonstrating genuine on-chain interactions and full compliance with the BOT Chain Anti-Cheating & Data Authenticity Policy.

---

## 2. Core Protocol Addresses & Verified Explorer Links

| Contract / Entity | On-Chain Address | BOTScan Explorer Link |
| :--- | :--- | :--- |
| **Primary Receiving Wallet (Deployer)** | `0x36a0b6A1fb7fC67aFe8A22939443311E1B612CfF` | [View Deployer on BOTScan](https://scan.bohr.life/address/0x36a0b6A1fb7fC67aFe8A22939443311E1B612CfF) |
| **AuraVault (CDP Lending Vault)** | `0x49486a845493bEC2CB320598EC4d1fEb11e1F546` | [View Vault on BOTScan](https://scan.bohr.life/address/0x49486a845493bEC2CB320598EC4d1fEb11e1F546) |
| **AuraToken (aBTC Synthetic ERC-20)** | `0x017D10E6FF87bBA10a7C24f5eC1dC627AC4e5698` | [View Token on BOTScan](https://scan.bohr.life/address/0x017D10E6FF87bBA10a7C24f5eC1dC627AC4e5698) |
| **Associated / Operational Wallet** | `0x696563545eF0904Fec0cc2BDe38b540836C5dAFe` | [View Associated on BOTScan](https://scan.bohr.life/address/0x696563545eF0904Fec0cc2BDe38b540836C5dAFe) |

---

## 3. Verified Transaction Ledger (Testnet Interactions)

### Transaction 1: Contract Deployment — AuraToken (Synthetic aBTC)
* **Contract Name:** `AuraToken`
* **Deployed Address:** `0x017D10E6FF87bBA10a7C24f5eC1dC627AC4e5698`
* **From:** `0x36a0b6A1fb7fC67aFe8A22939443311E1B612CfF`
* **Function:** Contract Creation (Bytecode Deployment)
* **Status:** Success (Mined in 1 block, 0.75s)
* **Explorer Link:** `https://scan.bohr.life/address/0x017D10E6FF87bBA10a7C24f5eC1dC627AC4e5698`

### Transaction 2: Contract Deployment — AuraVault (Collateralized Engine)
* **Contract Name:** `AuraVault`
* **Deployed Address:** `0x49486a845493bEC2CB320598EC4d1fEb11e1F546`
* **From:** `0x36a0b6A1fb7fC67aFe8A22939443311E1B612CfF`
* **Constructor Parameter:** `_auraToken = 0x017D10E6FF87bBA10a7C24f5eC1dC627AC4e5698`
* **Status:** Success (Mined in 1 block, 0.75s)
* **Explorer Link:** `https://scan.bohr.life/address/0x49486a845493bEC2CB320598EC4d1fEb11e1F546`

### Transaction 3: Minter Privilege Authorization
* **Transaction Hash:** `0xae0f6635da9ba77b4b6453a7ed3cf744cf0212be681b2bb2ace5ea3a258697ed`
* **To (Target Contract):** `0x017D10E6FF87bBA10a7C24f5eC1dC627AC4e5698` (`AuraToken`)
* **From:** `0x36a0b6A1fb7fC67aFe8A22939443311E1B612CfF` (Token Owner)
* **Method Called:** `setVault(address _vault)`
* **Parameter Passed:** `_vault = 0x49486a845493bEC2CB320598EC4d1fEb11e1F546`
* **Event Emitted:** `VaultSet(address indexed vault)`
* **Status:** Confirmed
* **Explorer Link:** [https://scan.bohr.life/tx/0xae0f6635da9ba77b4b6453a7ed3cf744cf0212be681b2bb2ace5ea3a258697ed](https://scan.bohr.life/tx/0xae0f6635da9ba77b4b6453a7ed3cf744cf0212be681b2bb2ace5ea3a258697ed)

---

## 4. Contract Methods Available for Real-Time Auditing

Ecosystem auditors and grant reviewers can directly inspect and call the following read and write methods using any standard Web3 tool or our interactive tester:

### Read Operations:
* `getBalance(address user)`: Returns user's active deposited BOT collateral in wei.
* `getDebt(address user)`: Returns user's active synthetic aBTC debt in 18-decimal units.
* `calculateMaxBorrowable(address user)`: Returns exact 50% LTV borrow limit based on oracle rate ($2 BOT / $100k aBTC).
* `getVaultStats()`: Returns protocol-wide total collateral, total debt, LTV ratio, and oracle rates.

### State Transitions:
* `deposit()`: `payable` method accepting native BOT coins.
* `mint(uint256 amountToMint)`: Mints synthetic `aBTC` while enforcing $LTV \le 50\%$.
* `repay(uint256 amountToRepay)`: Burns synthetic `aBTC` and reduces debt.
* `withdraw(uint256 amount)`: Returns native BOT collateral while preserving minimum 50% solvency.

---

## 5. Live Interactive Verification Tools

1. **Production Web3 Interface:**  
   [https://aura-finance-botchain.vercel.app](https://aura-finance-botchain.vercel.app)  
   Connects via MetaMask or OKX, switches automatically to BOT Chain Testnet (Chain ID 968), displays real-time collateral metrics, and allows one-click deposit/mint actions.

2. **Standalone HTML Direct Interaction Suite:**  
   [https://aura-finance-botchain.vercel.app/test-transaction.html](https://aura-finance-botchain.vercel.app/test-transaction.html)  
   Zero-dependency single-page HTML test runner using Ethers.js v6 that permits instant contract inspection and test transaction execution.

3. **Deployer Wallet History on BOTScan:**  
   [https://scan.bohr.life/address/0x36a0b6A1fb7fC67aFe8A22939443311E1B612CfF](https://scan.bohr.life/address/0x36a0b6A1fb7fC67aFe8A22939443311E1B612CfF)
