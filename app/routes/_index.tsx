import type { MetaFunction } from "@remix-run/node";
import { useEffect, useRef, useState } from "react";
import { Buffer } from "buffer";
import {
  Connection,
  Keypair,
  VersionedTransaction,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import { Form } from "@remix-run/react";
import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

const RPC_URL =
  "https://crimson-wider-field.solana-mainnet.quiknode.pro/ae46bf182ab5e4d0d797cfcf1222a368a8cafb47/";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

const getProvider = (): any | undefined => {
  if ("phantom" in window) {
    const anyWindow: any = window;
    const provider = anyWindow.phantom?.solana;

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

export default function Index() {
  const providerRef = useRef();
  const [pubKey, setPubKey] = useState(null);

  useEffect(() => {
    providerRef.current = getProvider();
    providerRef.current.on("connect", (pubKey) => {
      setPubKey(pubKey);
      console.log("connected!");
    });
  }, []);

  const { connection } = useConnection();
  const { publicKey, signTransaction, signAllTransactions, sendTransaction } =
    useWallet();

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <h1>Welcome to Remix</h1>
      <div>Pub key: {pubKey ? "i has pub key!" : "❌"}</div>

      <Form>
        <label>sol</label>
        <input type="text" name="sol" value={0.001} onChange={() => {}} />
        <label>usdc</label>
        <input type="text" name="usdc" />
      </Form>

      <button
        onClick={async () => {
          if (!signTransaction) return;

          const quoteResponse = await (
            await fetch(
              "https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=1000000&slippageBps=30&onlyDirectRoutes=false&asLegacyTransaction=false&experimentalDexes=Jupiter%20LO"
            )
          ).json();

          // get serialized transactions for the swap
          const { swapTransaction } = await (
            await fetch("https://quote-api.jup.ag/v6/swap", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                // quoteResponse from /quote api
                quoteResponse,
                // user public key to be used for the swap
                userPublicKey: publicKey,
                // auto wrap and unwrap SOL. default is true
                wrapAndUnwrapSol: true,
                // feeAccount is optional. Use if you want to charge a fee.  feeBps must have been passed in /quote API.
                // feeAccount: "fee_account_public_key"
              }),
            })
          ).json();

          const swapTransactionBuf = Buffer.from(swapTransaction, "base64");

          const tx = VersionedTransaction.deserialize(swapTransactionBuf);

          await providerRef.current.signAndSendTransaction(tx);
        }}
      >
        Swap
      </button>
    </div>
  );
}
