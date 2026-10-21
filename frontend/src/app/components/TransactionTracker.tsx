'use client';

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { BOTCHAIN_TESTNET } from '../../contracts/AuraContracts';
import { ExternalLink, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';

interface TransactionTrackerProps {
  txHash: string;
  onConfirmed?: () => void;
  onClose?: () => void;
}

export default function TransactionTracker({
  txHash,
  onConfirmed,
  onClose,
}: TransactionTrackerProps) {
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'failed'>('pending');
  const [blockNumber, setBlockNumber] = useState<number | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const monitorTx = async () => {
      try {
        const provider = new ethers.JsonRpcProvider(
          BOTCHAIN_TESTNET.rpcUrl,
          {
            chainId: BOTCHAIN_TESTNET.chainId,
            name: 'botchain-testnet',
          },
          { staticNetwork: true }
        );

        console.log('[TransactionTracker] Monitoring BOT Chain tx:', txHash);

        // Check if already mined
        const receipt = await provider.getTransactionReceipt(txHash);
        if (receipt) {
          if (!isCancelled) {
            setBlockNumber(receipt.blockNumber);
            if (receipt.status === 1) {
              setStatus('confirmed');
              if (onConfirmed) onConfirmed();
            } else {
              setStatus('failed');
            }
          }
          return;
        }

        // Wait for confirmation with polling
        const interval = setInterval(async () => {
          if (isCancelled) {
            clearInterval(interval);
            return;
          }

          try {
            const r = await provider.getTransactionReceipt(txHash);
            if (r) {
              clearInterval(interval);
              if (!isCancelled) {
                setBlockNumber(r.blockNumber);
                if (r.status === 1) {
                  setStatus('confirmed');
                  if (onConfirmed) onConfirmed();
                } else {
                  setStatus('failed');
                }
              }
            }
          } catch (pollErr) {
            console.warn('[TransactionTracker] Polling check:', pollErr);
          }
        }, 3000);

        return () => clearInterval(interval);
      } catch (err) {
        console.error('[TransactionTracker] Error monitoring tx:', err);
      }
    };

    monitorTx();

    return () => {
      isCancelled = true;
    };
  }, [txHash, onConfirmed]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const explorerUrl = `${BOTCHAIN_TESTNET.blockExplorer}/tx/${txHash}`;

  if (status === 'confirmed') {
    return (
      <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-zinc-900 border-2 border-emerald-500/80 text-white p-4 rounded-2xl shadow-2xl shadow-emerald-950/40 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-sm text-emerald-300">Transaction Confirmed!</p>
              <p className="text-xs text-zinc-400">
                Mined in block #{blockNumber || 'latest'} (~0.75s finality)
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-zinc-800 flex justify-between items-center text-xs">
          <span className="font-mono text-zinc-400 truncate max-w-[180px]">
            {txHash.substring(0, 10)}...{txHash.substring(txHash.length - 8)}
          </span>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2"
          >
            <span>BOTScan</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-zinc-900 border-2 border-red-500/80 text-white p-4 rounded-2xl shadow-2xl shadow-red-950/40 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <p className="font-bold text-sm text-red-300">Transaction Reverted</p>
              <p className="text-xs text-zinc-400">Execution failed or out of gas</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-zinc-800 flex justify-between items-center text-xs">
          <span className="font-mono text-zinc-400 truncate max-w-[180px]">
            {txHash.substring(0, 10)}...
          </span>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-red-400 hover:text-red-300 font-semibold underline underline-offset-2"
          >
            <span>View details</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-zinc-900/95 backdrop-blur-md border border-zinc-700/80 text-white p-4 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
          <div>
            <p className="font-bold text-sm text-white">Pending Confirmation...</p>
            <p className="text-xs text-zinc-400">BOT Chain Testnet • {formatTime(timeElapsed)}</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-zinc-800 flex justify-between items-center text-xs">
        <span className="font-mono text-zinc-400 truncate max-w-[180px]">
          {txHash.substring(0, 10)}...{txHash.substring(txHash.length - 6)}
        </span>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-semibold"
        >
          <span>Track on BOTScan</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
