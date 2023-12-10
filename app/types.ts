import type {
  PublicKey,
  SendOptions,
  Transaction,
  TransactionSignature,
  VersionedTransaction,
} from "@solana/web3.js";
import { type EventEmitter } from "@solana/wallet-adapter-base";

interface PhantomWalletEvents {
  connect(...args: unknown[]): unknown;
  disconnect(...args: unknown[]): unknown;
  accountChanged(newPublicKey: PublicKey): unknown;
}
export interface PhantomWallet extends EventEmitter<PhantomWalletEvents> {
  solana?: {
    isPhantom: boolean;
  };
  isPhantom?: boolean;
  publicKey?: { toBytes(): Uint8Array };
  isConnected: boolean;
  signTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T
  ): Promise<T>;
  signAllTransactions<T extends Transaction | VersionedTransaction>(
    transactions: T[]
  ): Promise<T[]>;
  signAndSendTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
    options?: SendOptions
  ): Promise<{ signature: TransactionSignature }>;
  signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}
