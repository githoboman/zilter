'use client';

import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { BOTCHAIN_TESTNET } from '../contracts/AuraContracts';
import ConnectWallet from './components/ConnectWallet';
import Dashboard from './components/Dashboard';
import DepositBOT from './components/DepositBOT';
import MintABTC from './components/MintABTC';
import ProtocolDetails from './components/ProtocolDetails';
import TransactionTracker from './components/TransactionTracker';
import {
  ShieldCheck,
  Zap,
  Droplets,
  Wallet,
  ArrowRight,
  Percent,
  Coins,
  BookOpen,
} from 'lucide-react';

export default function Home() {
  const { account, connectWallet, switchToBotChain, isConnecting } = useWeb3();
  const [isClient, setIsClient] = useState(false);
  const [pendingTxHash, setPendingTxHash] = useState<string | null>(null);
  const [dashboardKey, setDashboardKey] = useState(0);
  const [activeTab, setActiveTab] = useState<'deposit' | 'mint'>('deposit');

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleTransactionSubmitted = (txHash: string) => {
    console.log('[Home] Transaction submitted to BOT Chain:', txHash);
    setPendingTxHash(txHash);
  };

  const handleTransactionConfirmed = () => {
    console.log('[Home] Transaction confirmed on BOT Chain, refreshing vault data');
    setDashboardKey((prev) => prev + 1);
  };

  if (!isClient) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400 font-mono text-sm">
        Initializing BOT Chain interface...
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-zinc-950 text-zinc-100">
      {/* Background Gradient Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/4 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      {/* Navigation Header */}
      <header className="z-20 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="font-extrabold text-white text-lg tracking-wider">A</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-white">AURA</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-mono border border-blue-500/20">
                  BOT Chain
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                Synthetic Bitcoin Protocol • Testnet (ID: 968)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <a
              href={BOTCHAIN_TESTNET.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors py-1.5 px-3 rounded-lg hover:bg-zinc-900 border border-transparent hover:border-zinc-800"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              <span>Dev Docs</span>
            </a>

            <a
              href={BOTCHAIN_TESTNET.faucetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors py-1.5 px-3 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20"
            >
              <Droplets className="w-3.5 h-3.5" />
              <span>Get tBOT</span>
            </a>

            <ConnectWallet />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="z-10 w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-10">
        {account ? (
          // CONNECTED VIEW
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Live Vault Dashboard */}
            <Dashboard key={dashboardKey} refreshTrigger={dashboardKey} />

            {/* Interactive CDP Actions: Deposit BOT / Mint aBTC */}
            <div className="w-full max-w-6xl mx-auto space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>Vault Actions</span>
                  <span className="text-xs font-normal text-zinc-400">(BOT Chain Testnet)</span>
                </h3>

                {/* Tab Switcher for mobile / compact layout */}
                <div className="flex rounded-xl bg-zinc-900 p-1 border border-zinc-800 md:hidden">
                  <button
                    onClick={() => setActiveTab('deposit')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeTab === 'deposit'
                        ? 'bg-blue-600 text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Deposit BOT
                  </button>
                  <button
                    onClick={() => setActiveTab('mint')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeTab === 'mint'
                        ? 'bg-purple-600 text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Mint aBTC
                  </button>
                </div>
              </div>

              {/* Desktop: Side-by-Side Cards; Mobile: Tab Switcher */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                <div className={`${activeTab === 'deposit' ? 'block' : 'hidden md:block'}`}>
                  <DepositBOT onSuccess={handleTransactionSubmitted} />
                </div>
                <div className={`${activeTab === 'mint' ? 'block' : 'hidden md:block'}`}>
                  <MintABTC onSuccess={handleTransactionSubmitted} refreshTrigger={dashboardKey} />
                </div>
              </div>
            </div>

            {/* Protocol Deployment & Testnet Verification Details */}
            <div className="w-full max-w-6xl mx-auto">
              <ProtocolDetails onSuccess={handleTransactionSubmitted} />
            </div>
          </div>
        ) : (
          // DISCONNECTED HERO VIEW
          <div className="py-12 sm:py-20 flex flex-col items-center text-center space-y-12 max-w-5xl mx-auto">
            {/* Hero Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-blue-500/20 text-xs font-semibold text-blue-300">
              <Zap className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span>Live on BOT Chain Testnet • Chain ID: 968</span>
            </div>

            {/* Headline */}
            <div className="space-y-4 max-w-3xl">
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
                Self-Repaying CDP Lending on{' '}
                <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  BOT Chain
                </span>
              </h1>
              <p className="text-base sm:text-lg text-zinc-400 leading-relaxed">
                Deposit native BOT tokens as collateral to borrow synthetic Bitcoin (aBTC).
                Built on BOT Chain’s high-performance 0.75-second finality layer with EVM compatibility and ultra-low fees.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center max-w-md">
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold text-base shadow-xl shadow-purple-600/20 hover:shadow-purple-600/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Wallet className="w-5 h-5" />
                <span>{isConnecting ? 'Connecting...' : 'Connect EVM Wallet'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href={BOTCHAIN_TESTNET.faucetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-semibold text-sm transition-all"
              >
                <Droplets className="w-4 h-4 text-blue-400" />
                <span>Claim Free tBOT Tokens</span>
              </a>
            </div>

            {/* Feature Badges Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full pt-8 text-left">
              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-white">0.75s Block Time</h4>
                <p className="text-xs text-zinc-400">
                  Instant transaction execution and near-immediate CDP collateral confirmations.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Percent className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-white">50% Maximum LTV</h4>
                <p className="text-xs text-zinc-400">
                  Conservative collateralized debt position parameters to protect borrowers and liquidity.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-white">Synthetic aBTC Token</h4>
                <p className="text-xs text-zinc-400">
                  Liquid ERC-20 Bitcoin synthetic pegged at $100,000 oracle valuation.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-white">EVM Architecture</h4>
                <p className="text-xs text-zinc-400">
                  Works seamlessly with MetaMask, OKX, Rabby, and all Ethereum-compatible Web3 tooling.
                </p>
              </div>
            </div>

            {/* Testnet Fast Connect Card */}
            <div className="w-full max-w-3xl rounded-2xl bg-zinc-900/90 border border-zinc-800 p-6 text-left space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">BOT Chain Testnet Network Configuration</h3>
                  <p className="text-xs text-zinc-400">Add directly to your Web3 wallet</p>
                </div>
                <button
                  onClick={switchToBotChain}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer transition-colors"
                >
                  Add to Wallet
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/60">
                  <span className="text-[10px] text-zinc-500 uppercase font-sans block">Network Name</span>
                  <span className="text-zinc-200">BOT Testnet</span>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/60">
                  <span className="text-[10px] text-zinc-500 uppercase font-sans block">Chain ID</span>
                  <span className="text-zinc-200">968 (0x3c8)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/60">
                  <span className="text-[10px] text-zinc-500 uppercase font-sans block">Currency</span>
                  <span className="text-zinc-200">BOT (18 dec)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/60">
                  <span className="text-[10px] text-zinc-500 uppercase font-sans block">RPC Endpoint</span>
                  <span className="text-blue-400 truncate block">rpc.bohr.life</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Transaction Tracker */}
      {pendingTxHash && (
        <TransactionTracker
          txHash={pendingTxHash}
          onConfirmed={handleTransactionConfirmed}
          onClose={() => setPendingTxHash(null)}
        />
      )}

      {/* Footer */}
      <footer className="w-full mt-auto border-t border-zinc-800/80 bg-zinc-950 py-8 px-4 text-center text-xs text-zinc-500 space-y-2">
        <div className="flex flex-wrap items-center justify-center gap-6 text-zinc-400">
          <a
            href={BOTCHAIN_TESTNET.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            Developer Documentation
          </a>
          <a
            href={BOTCHAIN_TESTNET.faucetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            tBOT Faucet
          </a>
          <a
            href={BOTCHAIN_TESTNET.blockExplorer}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            BOTScan Explorer
          </a>
          <a
            href="/test-transaction.html"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors text-blue-400 font-mono"
          >
            Standalone Test Tool (HTML)
          </a>
        </div>
        <p>© 2026 Aura Finance. Migrated & Deployed for BOT Chain Testnet.</p>
      </footer>
    </main>
  );
}