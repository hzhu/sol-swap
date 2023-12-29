import type { Token, QuoteResponse, ParsedTokenAccountsByOwner } from "~/types";

export interface ReducerState {
  sellToken: Token;
  buyToken: Token;
  sellAmount: string;
  buyAmount: string;
  sellSymbolInput: string;
  buySymbolInput: string;
  isSwapping: boolean;
  fetchingQuote: boolean;
  transactionReceipt: string;
  quoteResponse: QuoteResponse | undefined;
  nativeBalance: undefined;
  tokenAccounts: ParsedTokenAccountsByOwner | undefined;
}

export type ActionTypes =
  | {
      type: "set quote response";
      payload: QuoteResponse | undefined;
    }
  | {
      type: "set token accounts by owner";
      payload: ParsedTokenAccountsByOwner | undefined;
    }
  | {
      type: "fetching quote";
      payload: boolean;
    }
  | {
      type: "set is swapping";
      payload: boolean;
    }
  | {
      type: "set sell amount";
      payload: string;
    }
  | {
      type: "set buy amount";
      payload: string;
    }
  | {
      type: "set transaction receipt";
      payload: string;
    }
  | {
      type: "set native balance";
      payload: any;
    }
  | {
      type: "reverse trade direction";
    }
  | {
      type: "set sell token";
      payload: Token;
    }
  | {
      type: "set buy token";
      payload: Token;
    }
  | {
      type: "set sell symbol input";
      payload: string;
    }
  | {
      type: "set buy symbol input";
      payload: string;
    }
  | {
      type: "reset";
    };

export const initialState = {
  nativeBalance: undefined,
  tokenAccounts: undefined,
  sellAmount: "",
  buyAmount: "",
  quoteResponse: undefined,
  fetchingQuote: false,
  isSwapping: false,
  transactionReceipt: "",
  sellSymbolInput: "SOL",
  buySymbolInput: "USDC",
  sellToken: {
    address: "So11111111111111111111111111111111111111112",
    chainId: 101,
    decimals: 9,
    name: "Wrapped SOL",
    symbol: "SOL",
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
    tags: ["old-registry"],
  },
  buyToken: {
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    chainId: 101,
    decimals: 6,
    name: "USD Coin",
    symbol: "USDC",
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
    tags: ["old-registry", "solana-fm"],
  },
};

export const reducer = (state: ReducerState, action: ActionTypes) => {
  switch (action.type) {
    case "reverse trade direction":
      return {
        ...state,
        sellAmount: state.buyAmount,
        buyToken: state.sellToken,
        sellToken: state.buyToken,
        sellSymbolInput: state.buyToken.symbol,
        buySymbolInput: state.sellToken.symbol,
      };
    case "set quote response":
      return {
        ...state,
        quoteResponse: action.payload,
      };
    case "set token accounts by owner":
      return {
        ...state,
        tokenAccounts: action.payload,
      };
    case "fetching quote":
      return {
        ...state,
        fetchingQuote: action.payload,
      };
    case "set sell amount":
      return {
        ...state,
        sellAmount: action.payload,
      };
    case "set buy amount":
      return {
        ...state,
        buyAmount: action.payload,
      };
    case "set sell token":
      return {
        ...state,
        sellToken: action.payload,
        sellSymbolInput: action.payload.symbol,
      };
    case "set buy token":
      return {
        ...state,
        buyToken: action.payload,
        buySymbolInput: action.payload.symbol,
      };
    case "set sell symbol input":
      return {
        ...state,
        sellSymbolInput: action.payload,
      };
    case "set buy symbol input":
      return {
        ...state,
        buySymbolInput: action.payload,
      };
    case "set is swapping":
      return {
        ...state,
        isSwapping: action.payload,
      };
    case "set transaction receipt":
      return {
        ...state,
        transactionReceipt: action.payload,
      };
    case "set native balance":
      return {
        ...state,
        nativeBalance: action.payload,
      };
    case "reset":
      return {
        ...state,
        buyAmount: "",
        sellAmount: "",
        isSwapping: false,
        transactionReceipt: "",
        quoteResponse: undefined,
      };
    default:
      return state;
  }
};
