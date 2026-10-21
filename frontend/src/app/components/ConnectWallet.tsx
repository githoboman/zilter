'use client';

import React from 'react';
import { useWeb3 } from '../../context/Web3Context';
import { BOTCHAIN_TESTNET } from '../../contracts/AuraContracts';
import { Wallet, ExternalLink, AlertTriangle, CheckCircle2, Droplets } from 'lucide-react';

export default function ConnectWallet() {
  const {
    account,
    isCorrectNetwork,
    botBalance,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    switchToBotChain,
  } = useWeb3();

  const shortenAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  if (account) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        {/* Network Status Badge */}
        {isCorrectNetwork ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>BOT Chain Testnet</span>
          </div>
        ) : (
          <button
            onClick={switchToBotChain}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold hover:bg-amber-500/30 transition-all cursor-pointer animate-pulse"
            title="Click to switch to BOT Chain Testnet"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Switch to BOT Chain</span>
          </button>
        )}

        {/* Faucet Link Button */}
        <a
          href={BOTCHAIN_TESTNET.faucetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-medium transition-all"
          title="Get free tBOT tokens from the official faucet"
        >
          <Droplets className="w-3.5 h-3.5" />
          <span>Faucet</span>
        </a>

        {/* Wallet Balance & Address Container */}
        <div className="flex items-center rounded-xl bg-zinc-900/90 border border-zinc-800 p-1 pl-3 shadow-lg">
          <div className="flex flex-col text-right mr-3">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Balance</span>
            <span className="text-xs font-semibold text-zinc-100 font-mono">
              {botBalance} <span className="text-purple-400">BOT</span>
            </span>
          </div>

          <a
            href={`${BOTCHAIN_TESTNET.blockExplorer}/address/${account}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono font-medium transition-colors"
            title="View on BOTScan"
          >
            <span>{shortenAddress(account)}</span>
            <ExternalLink className="w-3 h-3 text-zinc-400" />
          </a>

          <button
            onClick={disconnectWallet}
            className="ml-1 px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 text-xs font-medium transition-colors cursor-pointer"
            title="Disconnect wallet"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {error && (
        <span className="text-xs text-red-400 max-w-xs truncate" title={error}>
          {error}
        </span>
      )}
      <button
        type="button"
        onClick={connectWallet}
        disabled={isConnecting}
        className="flex items-center gap-2 cursor-pointer rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-5 py-2.5 text-white font-semibold text-sm shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 transition-all"
      >
        <Wallet className="w-4 h-4" />
        <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
      </button>
    </div>
  );
}
