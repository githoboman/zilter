'use client';

import React, { useState } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import {
  BOTCHAIN_TESTNET,
  CONTRACT_ADDRESSES,
} from '../../contracts/AuraContracts';
import {
  Copy,
  Check,
  ExternalLink,
  PlusCircle,
  FileCheck,
  Send,
  Droplets,
} from 'lucide-react';
import { ethers } from 'ethers';

interface ProtocolDetailsProps {
  onSuccess?: (txHash: string) => void;
}

export default function ProtocolDetails({ onSuccess }: ProtocolDetailsProps) {
  const { account, getSigner, isCorrectNetwork, switchToBotChain, refreshBalance } = useWeb3();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [sendingTestTx, setSendingTestTx] = useState(false);
  const [testTxError, setTestTxError] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Helper to send a quick 0-BOT test transaction or self-transfer on BOT Chain Testnet to generate a verified tx hash for submission forms!
  const sendTestnetVerificationTx = async () => {
    setTestTxError(null);
    if (!account) {
      setTestTxError('Connect your wallet first');
      return;
    }

    if (!isCorrectNetwork) {
      const switched = await switchToBotChain();
      if (!switched) return;
    }

    try {
      setSendingTestTx(true);
      const signer = await getSigner();
      if (!signer) throw new Error('No signer available');

      // Send 0.0001 BOT self-transfer or interaction
      const tx = await signer.sendTransaction({
        to: CONTRACT_ADDRESSES.testnet.vault,
        value: ethers.parseEther('0.0001'),
        data: '0xd0e30db0', // deposit()
      });

      console.log('[ProtocolDetails] Testnet verification tx sent:', tx.hash);
      if (onSuccess) {
        onSuccess(tx.hash);
      }
      tx.wait().then(() => refreshBalance());
    } catch (err: any) {
      console.error('[ProtocolDetails] Test tx error:', err);
      setTestTxError(err?.message || 'Transaction was rejected');
    } finally {
      setSendingTestTx(false);
    }
  };

  return (
    <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-6 shadow-xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">BOT Chain Testnet Deployment & Form Info</h3>
            <p className="text-xs text-zinc-400">Required contract addresses and RPC details for ecosystem submission</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={switchToBotChain}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add to MetaMask</span>
          </button>

          <a
            href={BOTCHAIN_TESTNET.faucetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-semibold transition-colors"
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>Claim tBOT</span>
          </a>
        </div>
      </div>

      {/* Copyable Form Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
        {/* Network & Chain ID */}
        <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex items-center justify-between">
          <div>
            <span className="text-zinc-500 block text-[10px] uppercase font-sans font-bold">Network / Chain ID</span>
            <span className="text-zinc-200">BOT Chain Testnet (ID: 968)</span>
          </div>
          <button
            onClick={() => copyToClipboard('968', 'chainId')}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Copy Chain ID"
          >
            {copiedField === 'chainId' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* RPC URL */}
        <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex items-center justify-between">
          <div>
            <span className="text-zinc-500 block text-[10px] uppercase font-sans font-bold">RPC Endpoint</span>
            <span className="text-zinc-200 truncate max-w-[200px]">{BOTCHAIN_TESTNET.rpcUrl}</span>
          </div>
          <button
            onClick={() => copyToClipboard(BOTCHAIN_TESTNET.rpcUrl, 'rpc')}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Copy RPC URL"
          >
            {copiedField === 'rpc' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* Vault Contract Address */}
        <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex items-center justify-between">
          <div>
            <span className="text-zinc-500 block text-[10px] uppercase font-sans font-bold">AuraVault Contract</span>
            <span className="text-blue-400 truncate max-w-[200px]">{CONTRACT_ADDRESSES.testnet.vault}</span>
          </div>
          <div className="flex items-center gap-1">
            <a
              href={`${BOTCHAIN_TESTNET.blockExplorer}/address/${CONTRACT_ADDRESSES.testnet.vault}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={() => copyToClipboard(CONTRACT_ADDRESSES.testnet.vault, 'vault')}
              className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Copy Vault Address"
            >
              {copiedField === 'vault' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* aBTC Token Contract Address */}
        <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex items-center justify-between">
          <div>
            <span className="text-zinc-500 block text-[10px] uppercase font-sans font-bold">aBTC Token Contract</span>
            <span className="text-purple-400 truncate max-w-[200px]">{CONTRACT_ADDRESSES.testnet.aBtcToken}</span>
          </div>
          <div className="flex items-center gap-1">
            <a
              href={`${BOTCHAIN_TESTNET.blockExplorer}/address/${CONTRACT_ADDRESSES.testnet.aBtcToken}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={() => copyToClipboard(CONTRACT_ADDRESSES.testnet.aBtcToken, 'token')}
              className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Copy Token Address"
            >
              {copiedField === 'token' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* One-click Testnet Verification Tx Button */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950/30 to-purple-950/30 border border-blue-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs">
          <p className="font-semibold text-zinc-200">Need a live testnet transaction hash for your submission form?</p>
          <p className="text-zinc-400">Click below to send a quick verification interaction on BOT Chain Testnet.</p>
          {testTxError && <p className="text-red-400 mt-1">{testTxError}</p>}
        </div>

        <button
          onClick={sendTestnetVerificationTx}
          disabled={sendingTestTx}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{sendingTestTx ? 'Submitting...' : 'Send Live Testnet Tx'}</span>
        </button>
      </div>
    </div>
  );
}
