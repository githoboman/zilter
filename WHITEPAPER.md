# Aura Finance Whitepaper
**A Decentralized Collateralized Debt Engine and Synthetic Bitcoin Architecture on BOT Chain**

*Version 1.0 — October 2026*  
*Author: Aura Protocol Core Team*  
*Repository: [https://github.com/githoboman/zilter](https://github.com/githoboman/zilter)*  
*Network: BOT Chain Testnet (Chain ID: 968)*  

---

## Abstract
Aura Finance is a high-performance, non-custodial Collateralized Debt Position (CDP) and synthetic asset protocol natively engineered for the BOT Chain ecosystem. By locking native BOT coins as collateral, users can autonomously mint synthetic Bitcoin (**aBTC**) at a maximum Loan-to-Value (LTV) of 50.00%. Aura Finance directly leverages BOT Chain’s high throughput, sub-cent transaction fees, and rapid 0.75-second block finality to eliminate the high gas costs, liquidation lag, and cross-chain bridge risks that plague traditional DeFi protocols on Ethereum Layer 1 and slower networks. This document details the mathematical framework, smart contract architecture, risk parameters, economic incentives, and ecosystem integration roadmap of the Aura Protocol.

---

## 1. Executive Summary & Market Vision
Decentralized Finance (DeFi) requires reliable, non-custodial stable assets and benchmark stores of value. While Bitcoin remains the preeminent global crypto asset, utilizing Bitcoin inside smart-contract execution environments has historically required centralized custodial bridges (e.g., WBTC) or congested Layer 1 networks with prohibitive gas fees.

BOT Chain provides an ideal Layer 1 execution environment for next-generation financial primitives:
1. **0.75-Second Block Confirmations:** Near-instant transaction settlement eliminates front-running, mempool exploitation, and multi-minute block latency during high-volatility events.
2. **Ultra-Low Transaction Costs:** Typical transaction fees of approximately $0.06 enable micro-collateral management, automated vault rebalancing, and continuous debt servicing that would be economically unfeasible on legacy networks.
3. **EVM Native Interoperability:** 100% EVM compatibility enables seamless integration with institutional-grade developer tooling, hardware and browser wallets (MetaMask, OKX, Rabby), and DeFi composability.

Aura Finance establishes a foundational liquidity layer for BOT Chain by transforming the native utility token (**BOT**) into productive collateral that powers synthetic, liquid Bitcoin (**aBTC**).

---

## 2. Protocol Architecture & Mechanics

### 2.1 The CDP Lifecycle
The core of Aura Finance operates as an over-collateralized lending facility:
1. **Collateral Deposit:** Users deposit native BOT coins directly into the `AuraVault` smart contract.
2. **Borrowing Power Calculation:** The protocol computes real-time borrowing capacity based on the deposited collateral value and a conservative 50% Maximum LTV.
3. **Synthetic Asset Minting:** Users specify the amount of `aBTC` to mint. The vault triggers atomic minting on the `AuraToken` ERC-20 contract and delivers liquid `aBTC` to the user's wallet.
4. **Repayment & Debt Redemption:** Borrowers can repay any portion of their `aBTC` debt at any time. Repaid tokens are atomically burned by the vault, reducing the user's debt liability.
5. **Collateral Withdrawal:** Collateral can be freely withdrawn at any time, provided the remaining deposited BOT sustains an LTV equal to or less than 50.00%.

```
+-------------------------------------------------------------+
|                        USER WALLET                          |
+-------------------------------------------------------------+
      | (1) Deposit BOT Collateral        ^ (3) Receive aBTC
      v                                   |
+-------------------------------------------------------------+
|                         AURA VAULT                          |
|  - Tracks Collateral: botDeposits[user]                     |
|  - Tracks Debt:       debt[user]                            |
|  - Enforces LTV:      LTV_BPS = 5000 (50.00%)               |
+-------------------------------------------------------------+
      | (2) Authorized Mint Request       | (4) Burn on Repay
      v                                   v
+-------------------------------------------------------------+
|                     AURA TOKEN (aBTC)                       |
|  - Standard ERC-20 with onlyMinter Access                   |
|  - Total Supply dynamically backed by BOT Collateral        |
+-------------------------------------------------------------+
```

---

## 3. Mathematical Framework & Risk Parameters

### 3.1 Parameters and Constants
* **Collateral Asset:** Native `BOT` (18 decimals)
* **Debt Asset:** `aBTC` (18 decimals)
* **Maximum Loan-to-Value ($LTV_{\max}$):** $50.00\%$ ($5,000 \text{ basis points}$)
* **Basis Point Divisor ($BPS$):** $10,000$
* **Collateral Valuation Price ($P_{BOT}$):** $\$2.00 \text{ USD}$
* **Synthetic Asset Valuation Price ($P_{aBTC}$):** $\$100,000.00 \text{ USD}$

### 3.2 Formal Formulations

#### 1. Total Collateral Value ($V_C$)
For a given user address $u$ with deposited BOT balance $C_u$:
$$V_C(u) = \frac{C_u \times P_{BOT}}{10^{18}}$$

#### 2. Maximum Debt Capacity ($D_{\max}$)
The maximum total debt in USD that a user is permitted to hold:
$$V_{D,\max}(u) = \frac{V_C(u) \times LTV_{\max}}{BPS} = V_C(u) \times 0.50$$

Expressed in synthetic Bitcoin units ($aBTC$):
$$D_{\max}(u) = \frac{V_{D,\max}(u) \times 10^{18}}{P_{aBTC}}$$

#### 3. Available Borrowing Headroom ($D_{\text{avail}}$)
Given active outstanding debt $D_u$:
$$D_{\text{avail}}(u) = \max\left(0, D_{\max}(u) - D_u\right)$$

#### 4. Current Position LTV ($LTV_t$)
$$LTV_t(u) = \begin{cases} 
0, & \text{if } V_C(u) = 0 \\
\frac{D_u \times P_{aBTC}}{C_u \times P_{BOT}} \times 100\%, & \text{if } V_C(u) > 0 
\end{cases}$$

#### 5. Position Health Factor ($HF$)
A position is considered solvent and secure when $HF \ge 1.0$:
$$HF(u) = \frac{V_{D,\max}(u)}{D_u \times P_{aBTC} / 10^{18}}$$

---

## 4. Smart Contract Implementation & Security Model

### 4.1 `AuraVault.sol`
* **Collateral Segregation:** Internal mapping `mapping(address => uint256) public botDeposits` ensures non-commingling of individual user balances.
* **Over-collateralization Guard:** Any invocation of `mint()` or `withdraw()` strictly verifies:
  $$\text{newDebt} \le \text{calculateMaxBorrowable}(\text{user})$$
* **Reentrancy Protection & State Hygiene:** State variable adjustments (`debt[msg.sender]`, `botDeposits[msg.sender]`) precede all external calls or token minting requests (Checks-Effects-Interactions pattern).
* **Solvency Protection:** Collateral withdrawals that would cause $LTV_t > 50.00\%$ are reverted with `"Withdrawal would violate minimum 50% LTV"`.

### 4.2 `AuraToken.sol`
* **Minimalist ERC-20 Implementation:** Compliant with EIP-20 with full support for `transfer`, `approve`, and `transferFrom`.
* **Isolated Minter Role:** Only the verified `AuraVault` contract address holds permission to call `mint()` and `burn()`. External or unauthorized addresses cannot alter total supply.
* **Supply Neutrality:** Every minted unit of `aBTC` is backed by at least 200% value in deposited BOT coins.

---

## 5. Ecosystem Alignment & Value Proposition for BOT Chain

1. **Native BOT Token Sink:** By requiring native BOT coins to be locked in the vault to generate liquidity, Aura Finance directly removes circulating BOT supply from secondary market circulation, reducing sell pressure and creating organic buy-side utility.
2. **Foundational Collateral Primitive for DEXs:** `aBTC` minted on Aura Finance provides the necessary asset depth for pairings against BOT and USDT on official decentralized exchanges like **B DEX** (`dex.botchain.ai`).
3. **Sybil-Resistant On-Chain Activity:** CDP management involves genuine, multi-step smart contract calls (deposits, borrow allocations, repayments) that generate sustainable gas consumption and organic block usage.
4. **Agent OS Integration:** Aura Finance is architected to interface with BOT Chain's upcoming **Agent OS**, enabling autonomous DePIN and AI keeper bots to execute yield routing, automated collateral protection, and delta-neutral arbitrage.

---

## 6. Project Roadmap

```
+--------------------------------------------------------------------------+
| PHASE 1: TESTNET PROTOTYPE & DEPLOYMENT (COMPLETED - Q4 2026)           |
| - Solidity Core Architecture (AuraVault & AuraToken)                     |
| - Contract Deployment on BOT Chain Testnet (Chain ID 968)                |
| - Next.js 15 Web3 DApp with MetaMask/OKX Connection                      |
| - Standalone Developer Test Tool (/test-transaction.html)                |
+--------------------------------------------------------------------------+
                                    |
                                    v
+--------------------------------------------------------------------------+
| PHASE 2: AUDIT & DEX LIQUIDITY SEEDING (Q1 2027)                         |
| - Third-party smart contract security audit                              |
| - Mainnet Deployment (Chain ID 677)                                      |
| - B DEX Liquidity Pool Seeding (aBTC / BOT)                              |
| - BOT Chain Gas Rebate & Points Program Integration                      |
+--------------------------------------------------------------------------+
                                    |
                                    v
+--------------------------------------------------------------------------+
| PHASE 3: ADVANCED DEFI PRIMITIVES & AI KEEPERS (Q2 2027)                 |
| - Decentralized Pyth / Chainlink Price Oracle Integration                 |
| - Autonomous AI Keepers via BOT Chain Agent OS                           |
| - Multi-collateral support (liquid staked BOT, RWAs)                     |
+--------------------------------------------------------------------------+
```

---

## 7. Verified On-Chain Deployment Record (BOT Chain Testnet)

| Parameter | Specification |
| :--- | :--- |
| **Network** | BOT Chain Testnet |
| **Chain ID** | `968` (`0x3c8`) |
| **RPC Endpoint** | `https://rpc.bohr.life` |
| **Block Explorer** | `https://scan.bohr.life` |
| **Deployer Address** | `0x36a0b6A1fb7fC67aFe8A22939443311E1B612CfF` |
| **AuraToken (aBTC)** | `0x017D10E6FF87bBA10a7C24f5eC1dC627AC4e5698` |
| **AuraVault** | `0x49486a845493bEC2CB320598EC4d1fEb11e1F546` |
| **Minter Authorization TX** | `0xae0f6635da9ba77b4b6453a7ed3cf744cf0212be681b2bb2ace5ea3a258697ed` |
| **Source Code Repository** | `https://github.com/githoboman/zilter` |

---

## 8. Conclusion
Aura Finance bridges the gap between Bitcoin's premier wealth-storage utility and BOT Chain's high-throughput Layer 1 infrastructure. With verified on-chain deployments, robust mathematical risk limits, zero legacy dependency, and seamless Web3 wallet support, Aura Finance is poised to serve as an anchor DeFi protocol within the BOT Chain ecosystem.
