import { json, type LoaderFunctionArgs } from "@remix-run/node";

const baseUrl = "https://quote-api.jup.ag/v6/quote";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  // const response = await fetch(url);
  // const quoteResponse = await response.json();
  const queryString = url.searchParams.toString();

  const response = await fetch(`${baseUrl}?${queryString}`);
  const data = await response.json();

  return json(data);

  // const res = await fetch("https://quote-api.jup.ag/v6/swap", {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify({
  //     // quoteResponse from /quote api
  //     quoteResponse,
  //     // user public key to be used for the swap
  //     userPublicKey: "3zSiMfexWoWY8Yjvpd2bofNrUiCfH2S5Q9a7BwqiGUqM", // get from params
  //     // auto wrap and unwrap SOL. default is true
  //     wrapAndUnwrapSol: true,
  //     // feeAccount is optional. Use if you want to charge a fee.  feeBps must have been passed in /quote API.
  //     // feeAccount: "fee_account_public_key"
  //   }),
  // });

  // const { swapTransaction } = await res.json();

  // const swapTransactionBuf = Buffer.from(swapTransaction, "base64");

  // console.log(swapTransactionBuf, "<--lookz");

  // return json(swapTransactionBuf);
};
