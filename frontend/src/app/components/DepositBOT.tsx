'use client';

import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../../context/Web3Context';
import {
  CONTRACT_ADDRESSES,
  AURA_VAULT_ABI,
} from '../../contracts/AuraContracts';
import { ArrowDownCircle, Loader2, Sparkles } from 'lucide-react';

interface DepositBOTProps {
  onSuccess?: (txHash: string) => void;
}

export default function DepositBOT({ onSuccess }: DepositBOTProps) {
  const { account, getSigner, botBalance, isCorrectNetwork, switchToBotChain, refreshBalance } = useWeb3();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeposit = async () => {
    setError(null);
    if (!account) {
      setError('Please connect your wallet first.');
      return;
    }

    if (!isCorrectNetwork) {
      const switched = await switchToBotChain();
      if (!switched) return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid deposit amount greater than 0.');
      return;
    }

    const availableBot = parseFloat(botBalance);
    if (numAmount > availableBot) {
      setError(`Insufficient BOT balance. You have ${botBalance} BOT available.`);
      return;
    }

    try {
      setLoading(true);
      const signer = await getSigner();
      if (!signer) {
        throw new Error('Could not obtain wallet signer.');
      }

      const vaultAddress = CONTRACT_ADDRESSES.testnet.vault;
      const parsedValue = ethers.parseEther(amount);

      console.log(`[DepositBOT] Submitting deposit of ${amount} BOT to ${vaultAddress}`);

      let tx;
      try {
        // Attempt contract call
        const vaultContract = new ethers.Contract(vaultAddress, AURA_VAULT_ABI, signer);
        tx = await vaultContract.deposit({ value: parsedValue });
      } catch (contractErr: any) {
        console.warn('[DepositBOT] Contract method call fallback to payable transfer:', contractErr);
        // Fallback to sending native BOT transaction directly with deposit selector
        tx = await signer.sendTransaction({
          to: vaultAddress,
          value: parsedValue,
          data: '0xd0e30db0', // deposit() selector
        });
      }

      console.log('[DepositBOT] Transaction hash:', tx.hash);
      setAmount('');
      if (onSuccess) {
        onSuccess(tx.hash);
      }

      // Wait 1 confirmation in background
      tx.wait().then(() => {
        refreshBalance();
      }).catch((waitErr: any) => console.log('[DepositBOT] Wait notification:', waitErr));
    } catch (err: any) {
      console.error('[DepositBOT] Error during deposit:', err);
      setError(err?.message || 'Transaction was rejected or failed.');
    } finally {
      setLoading(false);
    }
  };

  const handlePreset = (percent: number) => {
    const total = parseFloat(botBalance);
    if (isNaN(total) || total <= 0) return;
    const reserved = 0.01; // reserve for gas
    const usable = Math.max(0, total - reserved);
    const calculated = (usable * percent).toFixed(4);
    setAmount(calculated);
  };

  return (
    <div className="rounded-2xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 p-6 sm:p-7 shadow-xl hover:border-blue-500/30 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <ArrowDownCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Deposit BOT</h3>
              <p className="text-xs text-zinc-400">Add native collateral to the vault</p>
            </div>
          </div>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 font-mono font-medium">
            50% LTV
          </span>
        </div>

        <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
          Deposit native BOT coins into the Aura Vault on BOT Chain Testnet to establish collateral and unlock borrowing power for synthetic Bitcoin (aBTC).
        </p>

        <div className="space-y-4 mb-6">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-zinc-300">Amount to Deposit</label>
              <span className="text-zinc-500 font-mono">
                Avail:{' '}
                <button
                  type="button"
                  onClick={() => handlePreset(1.0)}
                  className="text-blue-400 hover:underline cursor-pointer font-bold"
                >
                  {botBalance} BOT
                </button>
              </span>
            </div>

            <div className="relative">
              <input
                type="number"
                step="0.001"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-950/80 text-white placeholder-zinc-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none font-mono text-base transition-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-400 font-sans">BOT</span>
              </div>
            </div>

            {/* Quick Percentage Buttons */}
            <div className="flex gap-2 pt-1">
              {[0.25, 0.5, 0.75, 1.0].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handlePreset(pct)}
                  className="flex-1 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white text-[11px] font-mono font-medium transition-colors cursor-pointer"
                >
                  {pct === 1.0 ? 'MAX' : `${pct * 100}%`}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs">
              {error}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={handleDeposit}
        disabled={loading || !amount || parseFloat(amount) <= 0}
        className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3.5 text-white font-bold text-sm shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 transition-all flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Confirming on BOT Chain...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            <span>Deposit BOT Collateral</span>
          </>
        )}
      </button>
    </div>
  );
}
