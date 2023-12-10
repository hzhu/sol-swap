import type { MetaFunction } from "@remix-run/node";
import { useEffect, useRef, useState } from "react";
import { Buffer } from "buffer";
import { VersionedTransaction } from "@solana/web3.js";
import { Form } from "@remix-run/react";

import { useWallet } from "@solana/wallet-adapter-react";
import type { PhantomWallet } from "~/types";
import { set } from "@project-serum/anchor/dist/cjs/utils/features";

// Extend the Window interface
declare global {
  interface Window {
    phantom?: {
      solana: PhantomWallet;
    };
  }
}

const RPC_URL =
  "https://crimson-wider-field.solana-mainnet.quiknode.pro/ae46bf182ab5e4d0d797cfcf1222a368a8cafb47/";

export const meta: MetaFunction = () => {
  return [
    { title: "Solana Swap" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

const getProvider = () => {
  if ("phantom" in window) {
    const provider = window.phantom?.solana;

    if (provider?.isPhantom) {
      return provider;
    }
  }

  window.open("https://phantom.app/", "_blank");
};

const url =
  "https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=1000000&slippageBps=30&onlyDirectRoutes=false&asLegacyTransaction=false&experimentalDexes=Jupiter%20LO";

// inputMint
// outputMint
// amount=1000000
// slippageBps=30
// onlyDirectRoutes=false
// asLegacyTransaction=false
// experimentalDexes=Jupiter%20LO";

function lamportsToTokenUnits(lamports: number, decimals: number) {
  return lamports / Math.pow(10, decimals);
}

export default function Index() {
  const providerRef = useRef<PhantomWallet>();

  useEffect(() => {
    providerRef.current = getProvider();
  }, []);

  const { publicKey, connected } = useWallet();

  const [inputAmount, setInputAmount] = useState<string>("");
  const [outputAmount, setOutputAmount] = useState<string>("");

  const debouncedInputAmount: string = useDebounce(inputAmount, 500);

  // 1 usdc = 1.000000

  const [quoteResponse, setQuoteResponse] = useState<any>(null);

  const [isSwapping, setIsSwapping] = useState<boolean>(false);

  const [transactionReceipt, setTransactionReceipt] = useState<string>("");

  useEffect(() => {
    if (!debouncedInputAmount) return;
    if (debouncedInputAmount.toString() === "") return;
    if (Number(debouncedInputAmount) === 0) return;

    const baseUrl = "https://quote-api.jup.ag/v6/quote";

    const solDecimals = 9; // SOL uses 9 decimal places
    const amountInSmallestUnit =
      Number(debouncedInputAmount) * Math.pow(10, solDecimals);

    const params = {
      inputMint: "So11111111111111111111111111111111111111112",
      outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      amount: amountInSmallestUnit.toString(),
      slippageBps: "30",
      onlyDirectRoutes: "false",
      asLegacyTransaction: "false",
      experimentalDexes: "Jupiter LO",
    };

    const url = new URL(baseUrl);
    url.search = new URLSearchParams(params).toString();

    async function fetchQuote() {
      const response = await fetch(url.href);
      const data = await response.json();
      setQuoteResponse(data);

      setOutputAmount(
        lamportsToTokenUnits(
          Number(data.outAmount),
          6 // for usdc duh
        ).toString()
      );
    }

    fetchQuote();
  }, [debouncedInputAmount]);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <h1>solswap</h1>
      <div>Pub key: {publicKey ? `✅ ${publicKey}` : "❌"}</div>

      <Form>
        <label>sol</label>
        <input
          type="text"
          name="sol"
          value={inputAmount}
          onChange={(e) => {
            setInputAmount(e.target.value.trim());
          }}
        />
        <label>usdc</label>
        <input
          type="text"
          name="usdc"
          value={outputAmount}
          disabled
          onChange={() => {}}
        />
        <button
          type="button"
          onClick={async () => {
            if (!quoteResponse) return;

            try {
              setIsSwapping(true);
              // get serialized transactions for the swap
              const { swapTransaction } = await (
                await fetch("https://quote-api.jup.ag/v6/swap", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    quoteResponse,
                    userPublicKey: publicKey,
                    wrapAndUnwrapSol: true,
                  }),
                })
              ).json();

              const swapTransactionBuf = Buffer.from(swapTransaction, "base64");

              const versionedTx =
                VersionedTransaction.deserialize(swapTransactionBuf);

              const receipt = await providerRef.current?.signAndSendTransaction(
                versionedTx
              );
              receipt && setTransactionReceipt(receipt.signature);
            } catch (err) {
              console.error(err);
            } finally {
              // reset
              setInputAmount("");
              setOutputAmount("");
              setQuoteResponse(null);
              setIsSwapping(false);
            }
          }}
        >
          {isSwapping ? "Swapping..." : "Swap"}
        </button>
      </Form>
      {transactionReceipt && (
        <div>
          <a
            href={`https://explorer.solana.com/tx/${transactionReceipt}`}
            rel="noreferrer"
            target="_blank"
          >
            View transaction
          </a>
        </div>
      )}
    </div>
  );
}

function useDebounce(value: any, wait = 250) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => {
      setDebounced(value);
    }, wait);

    return () => {
      window.clearTimeout(id);
    };
  }, [value, wait]);

  return debounced;
}
