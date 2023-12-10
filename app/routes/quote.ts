import { json } from "@remix-run/node";
import { Connection, Keypair, VersionedTransaction } from "@solana/web3.js";

const url =
  "https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=1000000&slippageBps=30&onlyDirectRoutes=false&asLegacyTransaction=false&experimentalDexes=Jupiter%20LO";

export const loader = async (request: Request) => {
  const response = await fetch(url);
  const quoteResponse = await response.json();

  const res = await fetch("https://quote-api.jup.ag/v6/swap", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // quoteResponse from /quote api
      quoteResponse,
      // user public key to be used for the swap
      userPublicKey: "3zSiMfexWoWY8Yjvpd2bofNrUiCfH2S5Q9a7BwqiGUqM", // get from params
      // auto wrap and unwrap SOL. default is true
      wrapAndUnwrapSol: true,
      // feeAccount is optional. Use if you want to charge a fee.  feeBps must have been passed in /quote API.
      // feeAccount: "fee_account_public_key"
    }),
  });

  const { swapTransaction } = await res.json();

  const swapTransactionBuf = Buffer.from(swapTransaction, "base64");

  console.log(swapTransactionBuf, "<--lookz");

  return json(swapTransactionBuf);
};
