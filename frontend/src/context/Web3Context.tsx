'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { BOTCHAIN_TESTNET } from '../contracts/AuraContracts';

// Ethereum Provider Window Interface
declare global {
  interface Window {
    ethereum?: any;
  }
}

interface Web3ContextType {
  account: string | null;
  chainId: number | null;
  isCorrectNetwork: boolean;
  botBalance: string;
  isConnecting: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchToBotChain: () => Promise<boolean>;
  refreshBalance: () => Promise<void>;
  getProvider: () => ethers.BrowserProvider | ethers.JsonRpcProvider;
  getSigner: () => Promise<ethers.Signer | null>;
}

const Web3Context = createContext<Web3ContextType | null>(null);

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [botBalance, setBotBalance] = useState<string>('0.000');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isCorrectNetwork = chainId === BOTCHAIN_TESTNET.chainId;

  // Fallback public JSON-RPC provider for read-only queries
  const getFallbackProvider = useCallback(() => {
    return new ethers.JsonRpcProvider(BOTCHAIN_TESTNET.rpcUrl, {
      chainId: BOTCHAIN_TESTNET.chainId,
      name: 'botchain-testnet',
    }, { staticNetwork: true });
  }, []);

  const getProvider = useCallback(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      return new ethers.BrowserProvider(window.ethereum);
    }
    return getFallbackProvider();
  }, [getFallbackProvider]);

  const getSigner = useCallback(async (): Promise<ethers.Signer | null> => {
    if (typeof window === 'undefined' || !window.ethereum) return null;
    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      return await browserProvider.getSigner();
    } catch {
      return null;
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!account) return;
    try {
      // Use fallback provider directly to query the BOT Chain Testnet state
      const p = getFallbackProvider();
      const balanceWei = await p.getBalance(account);
      const formatted = ethers.formatEther(balanceWei);
      setBotBalance(parseFloat(formatted).toFixed(4));
    } catch (err) {
      console.warn('[Web3] Error fetching BOT balance:', err);
    }
  }, [account, getFallbackProvider]);

  const switchToBotChain = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setError('No EVM wallet detected. Please install MetaMask, Rabby, or OKX.');
      return false;
    }

    try {
      // Try switching chain first
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BOTCHAIN_TESTNET.chainIdHex }],
      });
      return true;
    } catch (switchError: any) {
      // 4902 code indicates chain is not yet added to wallet
      if (switchError?.code === 4902 || switchError?.message?.includes('Unrecognized chain')) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: BOTCHAIN_TESTNET.chainIdHex,
                chainName: BOTCHAIN_TESTNET.chainName,
                rpcUrls: [BOTCHAIN_TESTNET.rpcUrl],
                nativeCurrency: BOTCHAIN_TESTNET.currency,
                blockExplorerUrls: [BOTCHAIN_TESTNET.blockExplorer],
              },
            ],
          });
          return true;
        } catch (addError: any) {
          console.error('[Web3] Failed to add BOT Chain Testnet:', addError);
          setError(addError?.message || 'Failed to add BOT Chain to wallet');
          return false;
        }
      }
      console.error('[Web3] Failed to switch to BOT Chain:', switchError);
      setError(switchError?.message || 'Failed to switch network');
      return false;
    }
  };

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setError('No EVM wallet detected. Please install MetaMask, OKX, or a Web3 wallet.');
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const accounts: string[] = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        const currentChainHex = await window.ethereum.request({ method: 'eth_chainId' });
        const parsedChainId = parseInt(currentChainHex, 16);
        setChainId(parsedChainId);

        // Auto-switch to BOT Chain Testnet if on wrong network
        if (parsedChainId !== BOTCHAIN_TESTNET.chainId) {
          await switchToBotChain();
        }
      }
    } catch (err: any) {
      console.error('[Web3] Connect error:', err);
      setError(err?.message || 'Wallet connection was cancelled or rejected.');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setChainId(null);
    setBotBalance('0.000');
  };

  // Listen for provider events
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      console.log('[Web3] Accounts changed:', accounts);
      if (accounts.length > 0) {
        setAccount(accounts[0]);
      } else {
        disconnectWallet();
      }
    };

    const handleChainChanged = (newChainHex: string) => {
      console.log('[Web3] Chain changed:', newChainHex);
      const parsed = parseInt(newChainHex, 16);
      setChainId(parsed);
      // EIP-1193 recommends refreshing page on chainChanged, but updating state is smoother
    };

    const handleDisconnect = () => {
      console.log('[Web3] Disconnected');
      disconnectWallet();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('disconnect', handleDisconnect);

    // Initial silent check
    window.ethereum
      .request({ method: 'eth_accounts' })
      .then((accounts: string[]) => {
        if (accounts && accounts.length > 0) {
          setAccount(accounts[0]);
          return window.ethereum.request({ method: 'eth_chainId' });
        }
      })
      .then((currentChainHex?: string) => {
        if (currentChainHex) {
          setChainId(parseInt(currentChainHex, 16));
        }
      })
      .catch((err: any) => console.log('[Web3] Silent connect check skipped:', err));

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, []);

  // Update balance when account or chain changes
  useEffect(() => {
    if (account) {
      refreshBalance();
      const interval = setInterval(refreshBalance, 8000);
      return () => clearInterval(interval);
    }
  }, [account, chainId, refreshBalance]);

  return (
    <Web3Context.Provider
      value={{
        account,
        chainId,
        isCorrectNetwork,
        botBalance,
        isConnecting,
        error,
        connectWallet,
        disconnectWallet,
        switchToBotChain,
        refreshBalance,
        getProvider,
        getSigner,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}
