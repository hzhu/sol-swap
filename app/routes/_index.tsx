import Confetti from "react-confetti";
import { Form } from "@remix-run/react";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { VersionedTransaction, PublicKey } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  Button,
  ComboBox,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Text,
  Dialog,
  Heading,
  Modal,
} from "react-aria-components";
import { useDebounce } from "~/hooks";
import { tokenList } from "~/tokenList";
import { initialState, reducer } from "~/reducer";
import { DirectionButton, Spinner } from "~/components";
import type { Token, PhantomWallet } from "~/types";
import type { MetaFunction, LinksFunction } from "@remix-run/node";
import styles from "~/tailwind.css";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

// Extend the Window interface
declare global {
  interface Window {
    phantom?: { solana: PhantomWallet };
  }
}

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

function lamportsToTokenUnits(lamports: number, decimals: number) {
  return lamports / Math.pow(10, decimals);
}

export default function Index() {
  const providerRef = useRef<PhantomWallet>();

  useEffect(() => {
    providerRef.current = getProvider();
  }, []);

  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const { publicKey, connected } = useWallet();
  const [state, dispatch] = useReducer(reducer, initialState);
  const debouncedSellAmount: string = useDebounce(state.sellAmount, 500);
  const [sellItems, setSellItems] = useState(
    tokenList.filter((item) => item.symbol.toLowerCase().includes("sol"))
  );
  const [buyItems, setBuyItems] = useState(
    tokenList.filter((item) => item.symbol.toLowerCase().includes("usdc"))
  );

  useEffect(() => {
    if (!publicKey) return;

    async function run() {
      if (!publicKey) return;
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: TOKEN_PROGRAM_ID }
      );

      dispatch({
        type: "set token accounts by owner",
        payload: tokenAccounts,
      });
    }

    run();
  }, [connection, publicKey]);

  useEffect(() => {
    if (!debouncedSellAmount) return;
    if (debouncedSellAmount.toString() === "") return;
    if (Number(debouncedSellAmount) === 0) return;
    if (!state.buyToken || !state.sellToken) return;

    const amountInSmallestUnit =
      Number(debouncedSellAmount) * Math.pow(10, state.sellToken.decimals);

    if (amountInSmallestUnit.toString().includes(".")) return;

    const searchParams = new URLSearchParams({
      slippageBps: "25",
      onlyDirectRoutes: "false",
      asLegacyTransaction: "false",
      inputMint: state.sellToken.address,
      outputMint: state.buyToken.address,
      amount: amountInSmallestUnit.toString(),
    }).toString();

    const url = `/quote?${searchParams}`;

    async function fetchQuote() {
      dispatch({ type: "fetching quote", payload: true });
      const response = await fetch(url);
      const data = await response.json();

      dispatch({ type: "set quote response", payload: data });

      dispatch({
        type: "set buy amount",
        payload: lamportsToTokenUnits(
          Number(data.outAmount),
          state.buyToken.decimals
        ).toString(),
      });

      dispatch({ type: "fetching quote", payload: false });
    }

    fetchQuote();
  }, [debouncedSellAmount, state.buyToken, state.sellToken]);

  useEffect(() => {
    async function run() {
      if (publicKey) {
        const balance = await connection.getBalance(
          new PublicKey(publicKey.toString())
        );

        const uiAmount = lamportsToTokenUnits(balance, 9);

        dispatch({
          type: "set native balance",
          payload: {
            uiAmount,
            uiAmountString: uiAmount.toString(),
            amount: balance.toString(),
            decimals: 9,
          },
        });
      }
    }
    if (publicKey) {
      run();
    }
  }, [connection, publicKey]);

  const sellBalanceSPL = useMemo(() => {
    if (state.tokenAccounts) {
      const [balance] = state.tokenAccounts.value.filter((v) => {
        return v.account.data.parsed.info.mint === state.sellToken.address;
      });

      if (balance) {
        return balance.account.data.parsed.info.tokenAmount;
      }
    }

    return undefined;
  }, [state.tokenAccounts, state.sellToken]);

  const balanceUi =
    state.sellToken.address === "So11111111111111111111111111111111111111112"
      ? state.nativeBalance
      : sellBalanceSPL;

  const insufficientBalance =
    lamportsToTokenUnits(
      Number(state.quoteResponse?.inAmount),
      state.sellToken.decimals
    ) >= balanceUi?.uiAmount;

  return (
    <main
      style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}
      className="sm:max-w-2xl mx-auto text-lg mt-10 sm:mt-40"
    >
      <section>
        <h1 className="text-center text-4xl mt-6 mb-3">sol swap</h1>
        <Form>
          <div className="sm:flex sm:justify-between bg-purple-300 sm:rounded-tl-lg sm:rounded-tr-lg p-4 pb-8 sm:pb-4">
            <div>
              <label
                htmlFor="sell-input"
                className="text-base cursor-pointer font-semibold"
              >
                You sell
              </label>
              <div className="flex w-full">
                <img
                  alt="sol"
                  src={state.sellToken.logoURI}
                  className="w-12 h-12 m-0 p-0 mr-3 rounded-full"
                />
                <Input
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
                  value={state.sellAmount}
                  pattern="^[0-9]*[.,]?[0-9]*$"
                  className="px-3 py-2 rounded-lg border w-full border-purple-800 outline-none outline-2 outline-dotted  focus-visible:outline-purple-900"
                  onChange={(e) => {
                    if (/^[0-9]*\.?[0-9]*$/.test(e.target.value)) {
                      dispatch({
                        type: "set sell amount",
                        payload: e.target.value.trim(),
                      });
                    }
                    if (e.target.value === "") {
                      dispatch({ type: "set buy amount", payload: "" });
                      dispatch({
                        type: "set quote response",
                        payload: undefined,
                      });
                    }
                  }}
                />
              </div>
              <Text className="text-xs block mt-2 text-end h-4">
                {balanceUi && `Balance: ${balanceUi.uiAmountString}`}
              </Text>
            </div>
            <ComboBox
              menuTrigger="focus"
              items={sellItems}
              onInputChange={(value: string) => {
                dispatch({ type: "set sell symbol input", payload: value });
                const filteredList = tokenList.filter((token) => {
                  return token.symbol
                    .toLowerCase()
                    .includes(value.toLowerCase());
                });
                setSellItems(filteredList.slice(0, 7));
              }}
              inputValue={state.sellSymbolInput}
              selectedKey={state.sellToken.address}
              onSelectionChange={(id) => {
                const selectedItem = sellItems.find((o) => o.address === id);
                if (!selectedItem) return;
                if (selectedItem?.address === state.buyToken.address) {
                  dispatch({ type: "reverse trade direction" });
                } else {
                  dispatch({ type: "set sell token", payload: selectedItem });
                }
              }}
            >
              <Label className="text-xs cursor-pointer">
                Search for any token
              </Label>
              <div>
                <Input className="px-3 py-2 rounded-lg border w-full border-purple-800 outline-none outline-2 outline-dotted  focus-visible:outline-purple-900" />
                <Button>🔍</Button>
              </div>
              <Popover>
                <ListBox>
                  {(item: Token) => (
                    <ListBoxItem
                      id={item.address}
                      key={item.address}
                      textValue={item.symbol}
                      className="flex font-sans items-center px-4 py-3 cursor-pointer outline-none border-0 border-none rounded-md data-[focused]:bg-purple-900 data-[focused]:dark:bg-purple-800 data-[focused]:text-white data-[disabled]:bg-gray-100"
                    >
                      <img
                        alt={item.symbol}
                        src={item.logoURI}
                        className="rounded-full"
                        style={{ width: "1.5rem", height: "1.5rem" }}
                      />
                      &nbsp;
                      <span>{item.symbol}</span>
                    </ListBoxItem>
                  )}
                </ListBox>
              </Popover>
            </ComboBox>
          </div>
          <div className="flex justify-center items-center h-0 relative bottom-2">
            <DirectionButton
              disabled={state.isSwapping || state.fetchingQuote}
              onClick={() => {
                dispatch({ type: "reverse trade direction" });
                setSellItems(buyItems);
                setBuyItems(sellItems);
              }}
              className="border-purple-800 outline-none outline-2 outline-dotted  focus-visible:outline-purple-900"
            />
          </div>
          <div className="sm:flex sm:items-center sm:justify-between bg-green-300 rounded-bl-lg rounded-br-lg p-4 mb-2">
            <div className="sm:mr-12">
              <div>
                <label htmlFor="buy-input" className="text-base font-semibold">
                  You receive
                </label>
                <div className="flex items-center">
                  <img
                    alt="sol"
                    src={state.buyToken.logoURI}
                    className="w-12 h-12 m-0 p-0 mr-3 rounded-full"
                  />
                  <input
                    disabled
                    type="text"
                    id="buy-input"
                    name="buy-input"
                    placeholder="0.0"
                    value={state.buyAmount}
                    className="px-3 py-2 rounded-lg border cursor-not-allowed bg-gray-200 w-full"
                  />
                </div>
              </div>
            </div>
            <div>
              <ComboBox
                menuTrigger="focus"
                items={buyItems}
                onInputChange={(value: string) => {
                  dispatch({ type: "set buy symbol input", payload: value });
                  const newItems = tokenList.filter((token) => {
                    return token.symbol
                      .toLowerCase()
                      .includes(value.toLowerCase());
                  });
                  setBuyItems(newItems.slice(0, 7));
                }}
                inputValue={state.buySymbolInput}
                selectedKey={state.buyToken.address}
                onSelectionChange={(id) => {
                  const selectedItem = buyItems.find((o) => o.address === id);
                  if (!selectedItem) return;
                  if (selectedItem?.address === state.sellToken.address) {
                    dispatch({ type: "reverse trade direction" });
                  } else {
                    selectedItem &&
                      dispatch({
                        type: "set buy token",
                        payload: selectedItem,
                      });
                  }
                }}
              >
                <Label className="text-xs cursor-pointer">
                  Search for any token
                </Label>
                <div>
                  <Input className="px-3 py-2 rounded-lg border w-full border-green-800 outline-none outline-2 outline-dotted  focus-visible:outline-green-900" />
                  <Button>🔍</Button>
                </div>
                <Popover>
                  <ListBox>
                    {(item: Token) => (
                      <ListBoxItem
                        id={item.address}
                        key={item.address}
                        textValue={item.symbol}
                        className="flex font-sans items-center px-4 py-3 cursor-pointer outline-none border-0 border-none rounded-md data-[focused]:bg-purple-900 data-[focused]:dark:bg-purple-800 data-[focused]:text-white data-[disabled]:bg-gray-100"
                      >
                        <img
                          alt={item.symbol}
                          src={item.logoURI}
                          className="rounded-full"
                          style={{ width: "1.5rem", height: "1.5rem" }}
                        />
                        &nbsp;
                        <span>{item.symbol}</span>
                      </ListBoxItem>
                    )}
                  </ListBox>
                </Popover>
              </ComboBox>
            </div>
          </div>
          {insufficientBalance && (
            <div className="text-center bg-red-200 my-2 border border-red-600 rounded-md py-2">
              Insufficient balance: You don't have enough{" "}
              {state.sellToken.symbol}.
            </div>
          )}
          <div className="px-4 sm:px-0 my-2">
            {connected ? (
              <button
                type="button"
                className={`border-green-800 outline-none outline-2 outline-dotted  focus-visible:outline-green-900 text-lg rounded-lg text-slate-50 transition-all duration-200 bg-purple-900 dark:bg-purple-900 disabled:text-slate-100 disabled:opacity-50 hover:bg-purple-600 active:bg-purple-700 dark:hover:bg-purple-900/75 dark:active:bg-purple-900/50 py-3 w-full ${
                  !state.quoteResponse || state.isSwapping || !publicKey
                    ? "cursor-not-allowed"
                    : "cursor-pointer"
                }`}
                disabled={
                  !state.quoteResponse ||
                  state.isSwapping ||
                  state.fetchingQuote
                }
                onClick={async () => {
                  if (!state.quoteResponse) return;

                  try {
                    dispatch({ type: "set is swapping", payload: true });
                    const { swapTransaction } = await (
                      await fetch("/swap", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          quoteResponse: state.quoteResponse,
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

                    const receipt =
                      await providerRef.current?.signAndSendTransaction(
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
                {state.fetchingQuote ? (
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
        isOpen={Boolean(state.transactionReceipt)}
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
