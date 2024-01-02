import { WSOL, USDC } from "./constants";
import type { Token } from "~/types";

export interface ReducerState {
  sellToken: Token;
  buyToken: Token;
  sellAmount: string;
  buyAmount: string;
  sellSymbolInput: string;
  buySymbolInput: string;
  isSwapping: boolean;
  transactionReceipt: string;
}

export type ActionTypes =
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
  balance: undefined,
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
    address: WSOL,
    chainId: 101,
    decimals: 9,
    name: "Wrapped SOL",
    symbol: "SOL",
    logoURI: `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${WSOL}/logo.png`,
    tags: ["old-registry"],
  },
  buyToken: {
    address: USDC,
    chainId: 101,
    decimals: 6,
    name: "USD Coin",
    symbol: "USDC",
    logoURI: `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${USDC}/logo.png`,
    tags: ["old-registry", "solana-fm"],
  },
};

const reverseTradeDirection = (state: ReducerState) => ({
  ...state,
  sellAmount: state.buyAmount,
  buyAmount: "",
  buyToken: state.sellToken,
  sellToken: state.buyToken,
  sellSymbolInput: state.buyToken.symbol,
  buySymbolInput: state.sellToken.symbol,
  fetchingQuote: state.sellAmount !== "",
});

export const reducer = (state: ReducerState, action: ActionTypes) => {
  switch (action.type) {
    case "reverse trade direction":
      return reverseTradeDirection(state);

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
      if (action.payload.address === state.sellToken.address) return state;
      if (action.payload.address === state.buyToken.address) {
        return reverseTradeDirection(state);
      }

      return {
        ...state,
        sellToken: action.payload,
        sellSymbolInput: action.payload.symbol,
      };
    case "set buy token":
      if (action.payload.address === state.buyToken.address) return state;
      if (action.payload.address === state.sellToken.address) {
        return reverseTradeDirection(state);
      }

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

    case "reset":
      return {
        ...state,
        buyAmount: "",
        sellAmount: "",
        isSwapping: false,
        quoteResponse: undefined,
      };
    default:
      return state;
  }
};
