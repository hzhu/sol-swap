import Confetti from "react-confetti";
import { Form } from "@remix-run/react";
import { useReducer, useState } from "react";
import { VersionedTransaction } from "@solana/web3.js";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  Button,
  Input,
  Text,
  Dialog,
  Heading,
  Modal,
} from "react-aria-components";
import { tokenList } from "~/tokenList";
import { lamportsToTokenUnits } from "~/utils";
import { initialState, reducer } from "~/reducer";
import {
  Spinner,
  BottomSheetTokenSearch,
  BottomSheetTrigger,
  DirectionButton,
} from "~/components";
import {
  useQuote,
  useBalance,
  useDebounce,
  useProvider,
  useTokenBalance,
} from "~/hooks";
import type { MetaFunction, LinksFunction } from "@remix-run/node";
import type { Token } from "~/types";
import tailwindStyles from "~/styles/tailwind.css";
import reactAriaStyles from "~/styles/react-aria.css";
import solanaWalletStyles from "~/styles/solana-wallet.css";
import { WSOL } from "~/constants";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: tailwindStyles },
  { rel: "stylesheet", href: reactAriaStyles },
  { rel: "stylesheet", href: solanaWalletStyles },
];

export const meta: MetaFunction = () => {
  return [
    { title: "Solana Swap" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export default function Index() {
  const provider = useProvider();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const { publicKey, connected } = useWallet();
  const [state, dispatch] = useReducer(reducer, initialState);
  const { sellToken, buyToken, sellAmount, buyAmount, transactionReceipt } =
    state;
  const { data: balance } = useBalance({
    publicKey,
    connection,
    transactionReceipt,
  });

  const { tokenBalance } = useTokenBalance({
    publicKey,
    connection,
    token: sellToken,
    transactionReceipt,
  });
  const debouncedSellAmount: string = useDebounce(sellAmount, 500);
  const { data: quote, isFetching: isFetchingQuote } = useQuote({
    state,
    dispatch,
    debouncedSellAmount,
  });
  const [sellItems, setSellItems] = useState(
    tokenList.filter((item) => item.symbol.toLowerCase().includes("sol"))
  );
  const [buyItems, setBuyItems] = useState(
    tokenList.filter((item) => item.symbol.toLowerCase().includes("usdc"))
  );

  const isSellingSol = sellToken.address === WSOL;

  const balanceUi = isSellingSol ? balance : tokenBalance;

  const insufficientBalance =
    (!balanceUi ? 0 : balanceUi.uiAmount) <
    lamportsToTokenUnits(Number(quote?.inAmount), sellToken.decimals);

  return (
    <main
      className="sm:max-w-lg mx-auto text-lg mt-10 sm:mt-40"
      style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}
    >
      <section className="px-2">
        <h1 className="text-center text-4xl mt-6 mb-3">sol swap</h1>
        <Form>
          <div className="bg-purple-300 flex items-center justify-between rounded-2xl px-3 h-28 mb-1">
            <label
              htmlFor="sell-input"
              className="text-base cursor-pointer font-semibold w-2/3"
            >
              <div>Sell</div>
              <Input
                autoFocus
                name="sol"
                type="text"
                minLength={1}
                maxLength={50}
                id="sell-input"
                placeholder="0.0"
                autoCorrect="off"
                autoComplete="off"
                spellCheck="false"
                inputMode="decimal"
                value={sellAmount}
                pattern="^[0-9]*[.,]?[0-9]*$"
                className="pl-1 pr-8 pt-2 pb-3 rounded-lg border-0 w-full outline-none bg-transparent text-3xl"
                onChange={(e) => {
                  if (/^[0-9]*\.?[0-9]*$/.test(e.target.value)) {
                    dispatch({
                      type: "set sell amount",
                      payload: e.target.value.trim(),
                    });
                  }
                  if (e.target.value === "") {
                    dispatch({ type: "set buy amount", payload: "" });
                  }
                }}
              />
            </label>
            <div className="flex items-end ml-3 flex-col justify-center">
              <BottomSheetTokenSearch
                onSelect={(token: Token) => {
                  dispatch({ type: "set sell token", payload: token });
                }}
              >
                <BottomSheetTrigger className="flex items-center bg-purple-800 text-white rounded-full p-1">
                  <img
                    alt={sellToken.name}
                    src={sellToken.logoURI}
                    className="w-8 h-8 m-0 p-0 rounded-full"
                  />
                  <span className="mx-2">{sellToken.symbol}</span>
                  <svg
                    className="mr-2"
                    aria-hidden="true"
                    focusable="false"
                    role="img"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                    width="12"
                  >
                    <path
                      fill="currentColor"
                      d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"
                    ></path>
                  </svg>
                </BottomSheetTrigger>
              </BottomSheetTokenSearch>
              <div className="flex items-center mt-2">
                {connected ? (
                  <Text className="text-xs blockmr-1 text-end text-nowrap">
                    {balance && balanceUi
                      ? `Balance: ${balanceUi.uiAmountString}`
                      : `Balance: 0`}
                  </Text>
                ) : null}
                {connected && balance && balanceUi && (
                  <Button
                    className="font-semibold text-xs text-purple-800 hover:bg-purple-800 hover:text-white py-0.5 px-1 rounded-md relative bottom-px left-0.5"
                    onPress={() => {
                      if (isSellingSol) {
                        const gasBuffer = 0.000004;
                        const payload = subtractFloats(
                          balance.uiAmount,
                          gasBuffer
                        ).toString();
                        dispatch({ type: "set sell amount", payload });
                      } else {
                        dispatch({
                          type: "set sell amount",
                          payload: tokenBalance?.uiAmountString || "",
                        });
                      }
                    }}
                  >
                    max
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-center items-center h-0 relative bottom-2">
            <DirectionButton
              disabled={state.isSwapping || isFetchingQuote}
              onClick={() => {
                setSellItems(buyItems);
                setBuyItems(sellItems);
                dispatch({ type: "reverse trade direction" });
              }}
              className="border-purple-800 outline-none outline-2 outline-dotted  focus-visible:outline-purple-900"
            />
          </div>
          <div className="bg-slate-300 flex items-center justify-between rounded-2xl px-3 h-28 cursor-not-allowed">
            <label
              htmlFor="buy-input"
              className="text-base cursor-not-allowed font-semibold w-2/3"
            >
              <div>Receive</div>
              <Input
                disabled
                type="text"
                id="buy-input"
                name="buy-input"
                placeholder="0.0"
                value={buyAmount}
                className="pl-1 pr-8 pt-2 pb-3 rounded-lg border-0 w-full outline-none bg-transparent text-3xl cursor-not-allowed"
              />
            </label>
            <div className="flex items-end ml-3 flex-col justify-center">
              <BottomSheetTokenSearch
                onSelect={(token: Token) => {
                  dispatch({ type: "set buy token", payload: token });
                }}
              >
                <BottomSheetTrigger className="flex items-center bg-purple-800 text-white rounded-full p-1">
                  <img
                    alt={buyToken.name}
                    src={buyToken.logoURI}
                    className="w-8 h-8 m-0 p-0 rounded-full"
                  />
                  <span className="mx-2">{buyToken.symbol}</span>
                  <svg
                    className="mr-2"
                    aria-hidden="true"
                    focusable="false"
                    role="img"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                    width="12"
                  >
                    <path
                      fill="currentColor"
                      d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"
                    ></path>
                  </svg>
                </BottomSheetTrigger>
              </BottomSheetTokenSearch>
            </div>
          </div>
          {connected && insufficientBalance && (
            <div className="text-center bg-red-200 mt-1 border border-red-600 rounded-xl py-2 text-sm sm:text-base">
              ⚠️ Insufficient balance: You don't have enough {sellToken.symbol}.
            </div>
          )}
          <div className="my-1">
            {connected ? (
              <button
                type="button"
                className={`border-green-800 outline-none outline-2 outline-dotted  focus-visible:outline-green-900 text-lg rounded-lg text-slate-50 transition-all duration-200 bg-purple-900 dark:bg-purple-900 disabled:text-slate-100 disabled:opacity-50 hover:bg-purple-600 active:bg-purple-700 dark:hover:bg-purple-900/75 dark:active:bg-purple-900/50 py-3 w-full disabled:cursor-not-allowed ${
                  !quote || state.isSwapping || !publicKey
                    ? "cursor-not-allowed"
                    : "cursor-pointer"
                }`}
                disabled={
                  state.isSwapping ||
                  isFetchingQuote ||
                  !quote ||
                  insufficientBalance
                }
                onClick={async () => {
                  if (!quote) return;

                  try {
                    dispatch({ type: "set is swapping", payload: true });
                    const { swapTransaction } = await (
                      await fetch("/swap", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          quoteResponse: quote,
                          userPublicKey: publicKey,
                          wrapAndUnwrapSol: true,
                        }),
                      })
                    ).json();

                    const swapTransactionBuf = Buffer.from(
                      swapTransaction,
                      "base64"
                    );

                    const versionedTx =
                      VersionedTransaction.deserialize(swapTransactionBuf);

                    const receipt = await provider?.signAndSendTransaction(
                      versionedTx
                    );
                    receipt &&
                      dispatch({
                        type: "set transaction receipt",
                        payload: receipt.signature,
                      });
                    console.info(`Transaction sent: ${receipt?.signature}`);
                  } catch (err) {
                    console.error(err);
                  } finally {
                    dispatch({ type: "reset" });
                  }
                }}
              >
                {isFetchingQuote ? (
                  <div className="flex justify-center">
                    <Spinner size={1.75} />
                    <div className="ml-2">Getting best price…</div>
                  </div>
                ) : state.isSwapping ? (
                  <div className="flex justify-center">
                    <Spinner size={1.75} />
                    <div className="ml-2">Swapping…</div>
                  </div>
                ) : (
                  "Swap"
                )}
              </button>
            ) : (
              <button
                onClick={() => setVisible(true)}
                className="border-green-800 outline-none outline-2 outline-dotted  focus-visible:outline-green-900 text-lg rounded-lg text-slate-50 transition-all duration-200 bg-purple-900 dark:bg-purple-900 disabled:text-slate-100 disabled:opacity-50 hover:bg-purple-600 active:bg-purple-700 dark:hover:bg-purple-900/75 dark:active:bg-purple-900/50 py-3 w-full"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </Form>
      </section>
      <Modal
        isOpen={Boolean(transactionReceipt)}
        className="max-w-xl px-2 sm:px-0"
      >
        <Dialog className="bg-white rounded-md p-8">
          <Confetti />
          <Heading slot="title" className="text-2xl text-center">
            Transaction Completed!
          </Heading>
          <div className="mt-8 mb-8">
            Your transaction has been completed and will soon be visible on the
            Solana Explorer. Please save the link for your records.
          </div>
          <div className="flex justify-end">
            <Button
              onPress={() => {
                dispatch({ type: "set transaction receipt", payload: "" });
              }}
              className="mr-3 w-18 h-10 py-1 px-3 rounded-md border flex items-center justify-center transition-colors duration-250 border-none dark:hover:bg-blue-marguerite-900 dark:pressed:bg-blue-marguerite-700"
            >
              <span>Close</span>
            </Button>
            <Button className="text-white w-18 h-10 py-1 px-3 rounded-md border flex items-center justify-center outline-none outline-2 outline-dotted  focus-visible:outline-purple-300 transition-colors duration-250 bg-purple-800 hover:bg-purple-800/95 pressed:bg-purple-950 border-purple-950">
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={`https://explorer.solana.com/tx/${state.transactionReceipt}`}
              >
                View Link
              </a>
            </Button>
          </div>
        </Dialog>
      </Modal>
    </main>
  );
}

export function subtractFloats(a: number, b: number, precision = 9) {
  const scale = Math.pow(10, precision);
  const scaledA = a * scale;
  const scaledB = b * scale;
  const result = scaledA - scaledB;
  return result / scale;
}
