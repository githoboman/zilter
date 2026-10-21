'use client';

import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../../context/Web3Context';
import {
  CONTRACT_ADDRESSES,
  AURA_VAULT_ABI,
} from '../../contracts/AuraContracts';
import { ArrowUpCircle, Loader2 } from 'lucide-react';

interface WithdrawBOTProps {
  onSuccess?: (txHash: string) => void;
}

export default function WithdrawBOT({ onSuccess }: WithdrawBOTProps) {
  const { account, getSigner, isCorrectNetwork, switchToBotChain, refreshBalance } = useWeb3();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWithdraw = async () => {
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
      setError('Please enter a valid amount to withdraw.');
      return;
    }

    try {
      setLoading(true);
      const signer = await getSigner();
      if (!signer) throw new Error('No signer available');

      const vaultContract = new ethers.Contract(
        CONTRACT_ADDRESSES.testnet.vault,
        AURA_VAULT_ABI,
        signer
      );

      const parsedWei = ethers.parseEther(amount);
      const tx = await vaultContract.withdraw(parsedWei);

      console.log('[WithdrawBOT] Transaction hash:', tx.hash);
      setAmount('');
      if (onSuccess) onSuccess(tx.hash);

      tx.wait().then(() => refreshBalance());
    } catch (err: any) {
      console.error('[WithdrawBOT] Error:', err);
      setError(err?.message || 'Withdrawal failed. Ensure you maintain >= 50% LTV.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
      <div className="flex items-center gap-2 mb-3">
        <ArrowUpCircle className="w-5 h-5 text-indigo-400" />
        <h3 className="font-bold text-white text-base">Withdraw BOT Collateral</h3>
      </div>
      <p className="text-xs text-zinc-400 mb-4">
        Unlock your deposited BOT coins back to your wallet (must maintain 50% minimum LTV if you have active debt).
      </p>
      <div className="space-y-3">
        <input
          type="number"
          step="0.01"
          placeholder="0.0 BOT"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={loading}
          className="w-full px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-white font-mono text-sm outline-none focus:border-indigo-500"
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          onClick={handleWithdraw}
          disabled={loading || !amount || parseFloat(amount) <= 0}
          className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Withdraw BOT'}
        </button>
      </div>
    </div>
  );
}
