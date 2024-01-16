import type { Address, Hash, Hex } from "viem";
import type {
  PublicKey,
  SendOptions,
  Transaction,
  TransactionSignature,
  VersionedTransaction,
} from "@solana/web3.js";
import { type EventEmitter } from "@solana/wallet-adapter-base";

declare global {
  interface Window {
    phantom?: { solana: PhantomWallet };
  }
}

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

// Quote response from Jupiter
export interface QuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee: null;
  priceImpactPct: string;
  routePlan: [
    {
      swapInfo: {
        ammKey: string;
        label: string;
        inputMint: string;
        outputMint: string;
        inAmount: string;
        outAmount: string;
        feeAmount: string;
        feeMint: string;
      };
      percent: number;
    }
  ];
  contextSlot: number;
  timeTaken: number;
}

type Context = {
  slot: number;
};

type AccountInfo<T> = {
  /** `true` if this account's data contains a loaded program */
  executable: boolean;
  /** Identifier of the program that owns the account */
  owner: PublicKey;
  /** Number of lamports assigned to the account */
  lamports: number;
  /** Optional data assigned to the account */
  data: T;
  /** Optional rent epoch info for account */
  rentEpoch?: number;
};

/**
 * RPC Response with extra contextual information
 */
type RpcResponseAndContext<T> = {
  /** response context */
  context: Context;
  /** response value */
  value: T;
};

type ParsedAccountData = {
  /** Name of the program that owns this account */
  program: string;
  /** Parsed account data */
  parsed: any;
  /** Space used by account data */
  space: number;
};

export type ParsedTokenAccountsByOwner = RpcResponseAndContext<
  Array<{
    pubkey: PublicKey;
    account: AccountInfo<ParsedAccountData>;
  }>
>;

export interface Token {
  address: string;
  chainId: number;
  decimals: number;
  name: string;
  symbol: string;
  logoURI: string;
  tags: string[];
}

export interface Balance {
  uiAmount: number;
  uiAmountString: string;
  amount: string;
  decimals: number;
}

// Deprecated—let's just use deBridge Liquidity Network
export interface QuoteResponseLiFi {
  type: string;
  id: string;
  tool: string;
  toolDetails: {
    key: string;
    name: string;
    logoURI: string;
  };
  action: {
    fromChainId: number;
    fromAmount: string;
    fromAddress: Address;
    slippage: number;
    toChainId: number;
    toAddress: string;
    fromToken: {
      address: Address;
      chainId: number;
      symbol: string;
      decimals: number;
      name: string;
      coinKey: string;
      logoURI: string;
      priceUSD: string;
    };
    toToken: {
      address: string;
      chainId: number;
      symbol: string;
      decimals: number;
      name: string;
      coinKey: string;
      logoURI: string;
      priceUSD: string;
    };
  };
  estimate?: {
    tool: string;
    toolData: {};
    fromAmount: string;
    fromAmountUSD: string;
    toAmount: string;
    toAmountMin: string;
    approvalAddress: Address;
    executionDuration: number;
    feeCosts: [
      {
        name: string;
        description: string;
        token: {
          address: Address;
          chainId: number;
          symbol: string;
          decimals: number;
          name: string;
          coinKey: string;
          logoURI: string;
          priceUSD: string;
        };
        amount: string;
        amountUSD: string;
        percentage: string;
        included: true;
      }
    ];
    gasCosts: [
      {
        type: string;
        price: string;
        estimate: string;
        limit: string;
        amount: string;
        amountUSD: string;
        token: {
          address: Address;
          chainId: number;
          symbol: string;
          decimals: number;
          name: string;
          coinKey: string;
          logoURI: string;
          priceUSD: string;
        };
      }
    ];
    toAmountUSD: string;
  };
  includedSteps: [
    {
      id: string;
      type: string;
      action: {
        fromChainId: number;
        fromAmount: string;
        fromAddress: Address;
        slippage: number;
        toChainId: number;
        toAddress: string;
        fromToken: {
          address: Address;
          chainId: number;
          symbol: string;
          decimals: number;
          name: string;
          coinKey: string;
          logoURI: string;
          priceUSD: string;
        };
        toToken: {
          address: string;
          chainId: number;
          symbol: string;
          decimals: number;
          name: string;
          coinKey: string;
          logoURI: string;
          priceUSD: string;
        };
      };
      estimate: {
        tool: string;
        fromAmount: string;
        fromAmountUSD: string;
        toAmount: string;
        toAmountMin: string;
        approvalAddress: Address;
        executionDuration: number;
        feeCosts: [
          {
            name: string;
            description: string;
            token: {
              address: Address;
              chainId: number;
              symbol: string;
              decimals: number;
              name: string;
              coinKey: string;
              logoURI: string;
              priceUSD: string;
            };
            amount: string;
            amountUSD: string;
            percentage: string;
            included: true;
          }
        ];
        gasCosts: [
          {
            type: string;
            price: string;
            estimate: string;
            limit: string;
            amount: string;
            amountUSD: string;
            token: {
              address: Address;
              chainId: number;
              symbol: string;
              decimals: number;
              name: string;
              coinKey: string;
              logoURI: string;
              priceUSD: string;
            };
          }
        ];
      };
      tool: string;
      toolDetails: {
        key: string;
        name: string;
        logoURI: string;
      };
    }
  ];
  transactionRequest: {
    data: Hash;
    to: Address;
    value: bigint;
    chainId: number;
    from: Address;
    gasLimit: Hex;
    gasPrice: bigint | undefined;
  };
}
