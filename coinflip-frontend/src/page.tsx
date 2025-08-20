'use client';

import { useMemo, useState } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import BN from 'bn.js';

// Your deployed Anchor program ID:
const PROGRAM_ID = 'ESPx7FyhiUZrpEj8baiT96b4GSaBxbtaDkUFB76RywAJ';
// Your treasury account:
const TREASURY_PUBKEY = 'CmRMnEw7jcTfspzGj3Sd142SdHQQfrdaypKxZqqY9NCx';

function CoinflipPanel() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();

  const [bet, setBet] = useState<number>(0.01);
  const [status, setStatus] = useState<string>('');
  const [pending, setPending] = useState<boolean>(false);

  const flipCoin = async () => {
    setStatus('');
    if (!publicKey) {
      setStatus('Please connect your wallet.');
      return;
    }
    if (bet <= 0) {
      setStatus('Bet must be greater than 0');
      return;
    }
    setPending(true);
    setStatus('Sending transaction...');
    try {
      const betLamports = Math.floor(Number(bet) * 1e9);
      const data = Buffer.concat([
        Buffer.from([0]), // Instruction index for "flip"
        new BN(betLamports).toArrayLike(Buffer, 'le', 8),
      ]);
      const keys = [
        { pubkey: new PublicKey(TREASURY_PUBKEY), isSigner: false, isWritable: true },
        { pubkey: publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ];
      const ix = new TransactionInstruction({
        keys,
        programId: new PublicKey(PROGRAM_ID),
        data,
      });
      const tx = new Transaction().add(ix);
      const txid = await sendTransaction(tx, connection);
      setStatus('Transaction sent! Awaiting confirmation...');
      await connection.confirmTransaction(txid, 'confirmed');
      setStatus('Coin flip complete! Check your wallet for updated balance.');
    } catch (e: any) {
      setStatus('Transaction failed: ' + (e.message || e.toString()));
    }
    setPending(false);
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-white/70 rounded-xl shadow-lg p-8 border border-gray-100">
      <h1 className="text-2xl font-bold mb-4 text-center">🪙 Solana Coinflip</h1>
      <WalletMultiButton className="mb-6 mx-auto" />
      <div className="flex flex-col items-center mb-4">
        <label className="mb-2 text-gray-700 font-semibold">Bet Amount (SOL):</label>
        <input
          type="number"
          min="0.001"
          step="0.001"
          value={bet}
          disabled={pending}
          onChange={e => setBet(Number(e.target.value))}
          className="border rounded p-2 w-32 text-center mb-4"
        />
        <button
          onClick={flipCoin}
          disabled={!connected || pending}
          className={`w-full py-2 px-4 rounded bg-blue-600 text-white font-bold transition hover:bg-blue-700 ${(!connected || pending) ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {pending ? 'Flipping...' : 'Flip!'}
        </button>
      </div>
      <div className="min-h-[2rem] text-center text-blue-700">{status}</div>
      <div className="mt-8 text-xs text-gray-500 text-center">
        Built with Next.js, Solana, and Anchor.<br />
        <b>Only use on Devnet!</b>
      </div>
    </div>
  );
}

export default function Page() {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => 'https://api.devnet.solana.com', []);
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200 flex flex-col justify-center">
            <CoinflipPanel />
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
