'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../../context/Web3Context';
import {
  CONTRACT_ADDRESSES,
  AURA_VAULT_ABI,
} from '../../contracts/AuraContracts';
import { Coins, Loader2, Sparkles, Info } from 'lucide-react';

interface MintABTCProps {
  onSuccess?: (txHash: string) => void;
  refreshTrigger?: number;
}

export default function MintABTC({ onSuccess, refreshTrigger }: MintABTCProps) {
  const { account, getSigner, getProvider, isCorrectNetwork, switchToBotChain, refreshBalance } = useWeb3();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [botDeposit, setBotDeposit] = useState<number>(0);
  const [currentDebt, setCurrentDebt] = useState<number>(0);
  const [maxBorrowable, setMaxBorrowable] = useState<number>(0);
  const [fetchingLimits, setFetchingLimits] = useState<boolean>(true);

  const fetchLimits = useCallback(async () => {
    if (!account) return;
    try {
      setFetchingLimits(true);
      const provider = getProvider();
      const vaultAddress = CONTRACT_ADDRESSES.testnet.vault;
      const vaultContract = new ethers.Contract(vaultAddress, AURA_VAULT_ABI, provider);

      const [depositRaw, debtRaw] = await Promise.all([
        vaultContract.getBalance(account).catch(() => BigInt(0)),
        vaultContract.getDebt(account).catch(() => BigInt(0)),
      ]);

      const dep = parseFloat(ethers.formatEther(depositRaw || BigInt(0)));
      const dbt = parseFloat(ethers.formatEther(debtRaw || BigInt(0)));

      const botPrice = 2.0;
      const abtcPrice = 100000.0;
      const colUsd = dep * botPrice;
      const maxAllowedDebtAbtc = (colUsd * 0.5) / abtcPrice;
      const availableToMint = Math.max(0, maxAllowedDebtAbtc - dbt);

      setBotDeposit(dep);
      setCurrentDebt(dbt);
      setMaxBorrowable(availableToMint);
    } catch (err) {
      console.warn('[MintABTC] Error fetching limits:', err);
    } finally {
      setFetchingLimits(false);
    }
  }, [account, getProvider]);

  useEffect(() => {
    fetchLimits();
  }, [fetchLimits, refreshTrigger]);

  const handleMint = async () => {
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
      setError('Please enter a valid amount to mint.');
      return;
    }

    if (maxBorrowable > 0 && numAmount > maxBorrowable) {
      setError(`Amount exceeds your maximum borrowable limit of ${maxBorrowable.toFixed(8)} aBTC.`);
      return;
    }

    try {
      setLoading(true);
      const signer = await getSigner();
      if (!signer) throw new Error('Signer not available.');

      const vaultAddress = CONTRACT_ADDRESSES.testnet.vault;
      const vaultContract = new ethers.Contract(vaultAddress, AURA_VAULT_ABI, signer);
      const satoshisOrWei = ethers.parseEther(amount);

      console.log(`[MintABTC] Minting ${amount} aBTC from vault: ${vaultAddress}`);

      let tx;
      try {
        tx = await vaultContract.mint(satoshisOrWei);
      } catch (callErr: any) {
        console.warn('[MintABTC] Vault mint call failed, attempting fallback transaction:', callErr);
        // Fallback ABI call
        const iface = new ethers.Interface(AURA_VAULT_ABI);
        const data = iface.encodeFunctionData('mint', [satoshisOrWei]);
        tx = await signer.sendTransaction({
          to: vaultAddress,
          data,
        });
      }

      console.log('[MintABTC] Transaction hash:', tx.hash);
      setAmount('');
      if (onSuccess) {
        onSuccess(tx.hash);
      }

      tx.wait().then(() => {
        fetchLimits();
        refreshBalance();
      }).catch((waitErr: any) => console.log('[MintABTC] Wait notification:', waitErr));
    } catch (err: any) {
      console.error('[MintABTC] Error minting aBTC:', err);
      setError(err?.message || 'Mint transaction was rejected or failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleMaxMint = () => {
    if (maxBorrowable > 0) {
      // Use 99% of max to avoid any rounding precision issue
      const safeMax = (maxBorrowable * 0.99).toFixed(8);
      setAmount(safeMax);
    }
  };

  return (
    <div className="rounded-2xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 p-6 sm:p-7 shadow-xl hover:border-purple-500/30 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Mint aBTC</h3>
              <p className="text-xs text-zinc-400">Borrow synthetic Bitcoin against collateral</p>
            </div>
          </div>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 font-mono font-medium">
            1 aBTC = $100k
          </span>
        </div>

        <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
          Mint synthetic Bitcoin (aBTC) against your deposited BOT collateral at an ultra-safe 50% maximum Loan-to-Value ratio.
        </p>

        {/* Collateral & Borrow Limit Info Box */}
        <div className="mb-5 p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-2 text-xs">
          <div className="flex justify-between text-zinc-400">
            <span>Your Collateral:</span>
            <span className="font-mono text-zinc-200">
              {botDeposit.toFixed(4)} BOT <span className="text-zinc-500">(≈ ${(botDeposit * 2).toFixed(2)})</span>
            </span>
          </div>

          <div className="flex justify-between text-zinc-400">
            <span>Active Debt:</span>
            <span className="font-mono text-purple-300">{currentDebt.toFixed(8)} aBTC</span>
          </div>

          <div className="flex justify-between items-center pt-1 border-t border-zinc-800/60">
            <span className="font-semibold text-zinc-300">Max Available to Mint:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-emerald-400">
                {fetchingLimits ? 'Loading...' : `${maxBorrowable.toFixed(8)} aBTC`}
              </span>
              {maxBorrowable > 0 && (
                <button
                  type="button"
                  onClick={handleMaxMint}
                  className="px-1.5 py-0.5 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-[10px] font-bold uppercase transition-colors cursor-pointer"
                >
                  Max
                </button>
              )}
            </div>
          </div>

          {maxBorrowable <= 0 && botDeposit === 0 && !fetchingLimits && (
            <div className="flex items-center gap-1.5 text-amber-400 text-[11px] pt-1">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Deposit BOT first to establish collateral before minting.</span>
            </div>
          )}
        </div>

        <div className="space-y-4 mb-6">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300">
              Amount to Mint (aBTC)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.00000001"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00000000"
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-950/80 text-white placeholder-zinc-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none font-mono text-base transition-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <span className="text-xs font-bold text-purple-400 font-sans">aBTC</span>
              </div>
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
        onClick={handleMint}
        disabled={loading || !amount || parseFloat(amount) <= 0}
        className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3.5 text-white font-bold text-sm shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 transition-all flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Minting aBTC on BOT Chain...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            <span>Mint aBTC Tokens</span>
          </>
        )}
      </button>
    </div>
  );
}
