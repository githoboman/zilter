'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../../context/Web3Context';
import {
  BOTCHAIN_TESTNET,
  CONTRACT_ADDRESSES,
  AURA_VAULT_ABI,
  AURA_TOKEN_ABI,
} from '../../contracts/AuraContracts';
import {
  Coins,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  Layers,
  Percent,
} from 'lucide-react';

interface DashboardData {
  botDeposited: number;
  abtcDebt: number;
  abtcBalance: number;
  maxBorrowable: number;
  collateralUsd: number;
  currentLtv: number;
}

export default function Dashboard({ refreshTrigger }: { refreshTrigger?: number }) {
  const { account, getProvider, isCorrectNetwork, switchToBotChain } = useWeb3();

  const [data, setData] = useState<DashboardData>({
    botDeposited: 0,
    abtcDebt: 0,
    abtcBalance: 0,
    maxBorrowable: 0,
    collateralUsd: 0,
    currentLtv: 0,
  });

  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchDashboardData = useCallback(async () => {
    if (!account) return;

    try {
      setLoading(true);
      const provider = getProvider();
      const vaultAddress = CONTRACT_ADDRESSES.testnet.vault;
      const tokenAddress = CONTRACT_ADDRESSES.testnet.aBtcToken;

      const vaultContract = new ethers.Contract(vaultAddress, AURA_VAULT_ABI, provider);
      const tokenContract = new ethers.Contract(tokenAddress, AURA_TOKEN_ABI, provider);

      // Perform parallel read calls with graceful error fallbacks
      const [depositedRaw, debtRaw, abtcBalanceRaw] = await Promise.all([
        vaultContract.getBalance(account).catch(() => BigInt(0)),
        vaultContract.getDebt(account).catch(() => BigInt(0)),
        tokenContract.balanceOf(account).catch(() => BigInt(0)),
      ]);

      const botDeposited = parseFloat(ethers.formatEther(depositedRaw || BigInt(0)));
      const abtcDebt = parseFloat(ethers.formatEther(debtRaw || BigInt(0)));
      const abtcBalance = parseFloat(ethers.formatEther(abtcBalanceRaw || BigInt(0)));

      // Protocol constants: BOT = $2.00, aBTC = $100,000, LTV = 50%
      const botPriceUsd = 2.0;
      const abtcPriceUsd = 100000.0;
      const collateralUsd = botDeposited * botPriceUsd;
      const maxDebtUsd = collateralUsd * 0.5; // 50% LTV
      const totalMaxAbtc = maxDebtUsd / abtcPriceUsd;
      const maxBorrowable = Math.max(0, totalMaxAbtc - abtcDebt);

      const debtUsd = abtcDebt * abtcPriceUsd;
      const currentLtv = collateralUsd > 0 ? (debtUsd / collateralUsd) * 100 : 0;

      setData({
        botDeposited,
        abtcDebt,
        abtcBalance,
        maxBorrowable,
        collateralUsd,
        currentLtv,
      });
      setLastUpdated(new Date());
    } catch (err) {
      console.warn('[Dashboard] Error reading vault state:', err);
    } finally {
      setLoading(false);
    }
  }, [account, getProvider]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, refreshTrigger]);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 space-y-6">
      {/* Network Alert if not on testnet */}
      {!isCorrectNetwork && account && (
        <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-amber-200">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-semibold text-sm">You are not connected to BOT Chain Testnet</p>
              <p className="text-xs text-amber-300/80">
                Switch to Chain ID {BOTCHAIN_TESTNET.chainId} (BOT Chain) to interact with Aura contracts.
              </p>
            </div>
          </div>
          <button
            onClick={switchToBotChain}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-colors cursor-pointer"
          >
            Switch to BOT Chain Testnet
          </button>
        </div>
      )}

      {/* Header and Refresh Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Aura Protocol Vault</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono font-medium">
              BOT Chain v1.0
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Decentralized collateralized debt positions backed by native BOT coins
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <span className="text-[11px] text-zinc-500 font-mono">
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold shadow-md active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
            title="Refresh on-chain position"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Deposited Collateral */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800/80 p-6 shadow-xl hover:border-blue-500/40 transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>BOT Collateral Deposited</span>
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono">
              Oracle $2.00
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
              {data.botDeposited.toFixed(4)} <span className="text-lg text-blue-400 font-sans">BOT</span>
            </div>
            <div className="text-xs text-zinc-400 font-medium">
              ≈ ${(data.collateralUsd).toFixed(2)} USD Collateral Value
            </div>
          </div>
        </div>

        {/* Card 2: Synthetic Debt */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800/80 p-6 shadow-xl hover:border-purple-500/40 transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span>aBTC Debt (Borrowed)</span>
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 font-mono">
              50% Max LTV
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-purple-300 font-mono tracking-tight">
              {data.abtcDebt.toFixed(6)} <span className="text-lg text-purple-400 font-sans">aBTC</span>
            </div>
            <div className="text-xs text-zinc-400 font-medium">
              ≈ ${(data.abtcDebt * 100000).toFixed(2)} USD Debt Value
            </div>
          </div>
        </div>

        {/* Card 3: aBTC in Wallet */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800/80 p-6 shadow-xl hover:border-emerald-500/40 transition-all duration-300 group sm:col-span-2 lg:col-span-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-emerald-400" />
              <span>aBTC in Wallet</span>
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
              Liquid Token
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono tracking-tight">
              {data.abtcBalance.toFixed(6)} <span className="text-lg text-emerald-400 font-sans">aBTC</span>
            </div>
            <div className="text-xs text-zinc-400 font-medium">
              Available to transfer, hold or trade
            </div>
          </div>
        </div>
      </div>

      {/* Protocol Health & LTV Status Bar */}
      <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
              Current Loan-to-Value (LTV)
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-zinc-100">
                {data.currentLtv.toFixed(2)}%
              </span>
              <span className="text-xs text-zinc-500 font-mono">/ 50.00% max</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  data.currentLtv === 0
                    ? 'bg-zinc-800 text-zinc-400'
                    : data.currentLtv < 35
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : data.currentLtv < 45
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-red-500/20 text-red-300'
                }`}
              >
                {data.currentLtv === 0
                  ? 'No Debt'
                  : data.currentLtv < 35
                  ? 'Safe'
                  : data.currentLtv < 45
                  ? 'Moderate'
                  : 'High Risk'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-zinc-800 font-mono text-xs">
          <div>
            <span className="text-zinc-500 block">Available to Mint:</span>
            <span className="text-emerald-400 font-bold">{data.maxBorrowable.toFixed(6)} aBTC</span>
          </div>
          <a
            href={`${BOTCHAIN_TESTNET.blockExplorer}/address/${CONTRACT_ADDRESSES.testnet.vault}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-zinc-400 hover:text-blue-400 transition-colors"
          >
            <span>Vault on BOTScan</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
