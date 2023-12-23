import Confetti from "react-confetti";
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
import type { MetaFunction, LinksFunction } from "@remix-run/node";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { VersionedTransaction, PublicKey } from "@solana/web3.js";
import { Form } from "@remix-run/react";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import type {
  PhantomWallet,
  QuoteResponse,
  ParsedTokenAccountsByOwner,
} from "~/types";
import { tokenList } from "~/tokenList";
import { DirectionButton } from "~/components/DirectionButton";
import styles from "~/tailwind.css";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

// Extend the Window interface
declare global {
  interface Window {
    phantom?: {
      solana: PhantomWallet;
    };
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

const initialState = {
  nativeBalance: undefined,
  tokenAccounts: undefined,
  sellAmount: "",
  buyAmount: "",
  quoteResponse: undefined,
  fetchingQuote: false,
  isSwapping: false,
  transactionReceipt: "",
};

type ActionTypes =
  | {
      type: "set quote response";
      payload: QuoteResponse | undefined;
    }
  | {
      type: "set token accounts by owner";
      payload: ParsedTokenAccountsByOwner | undefined;
    };

const reducer = (state: ReducerState, action: ActionTypes) => {
  switch (action.type) {
    case "set quote response":
      return {
        ...state,
        quoteResponse: action.payload,
      };
    case "set token accounts by owner":
      return {
        ...state,
      };
    default:
      return state;
  }
};

export interface ReducerState {
  nativeBalance: undefined;
  tokenAccounts: ParsedTokenAccountsByOwner | undefined;
  sellAmount: string;
  buyAmount: string;
  quoteResponse: QuoteResponse | undefined;
  fetchingQuote: boolean;
  isSwapping: boolean;
  transactionReceipt: string;
}

export default function Index() {
  const providerRef = useRef<PhantomWallet>();

  useEffect(() => {
    providerRef.current = getProvider();
  }, []);

  const [isFetchingQuote, setIsFetchingQuote] = useState(false); // todo: user reducer
  const [nativeBalance, setNativeBalance] = useState<any>(); // todo: user reducer
  const { setVisible } = useWalletModal();
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();

  const [sellAmount, setSellAmount] = useState<string>(""); // todo: user reducer
  const [buyAmount, setBuyAmount] = useState<string>(""); // todo: user reducer
  const debouncedSellAmount: string = useDebounce(sellAmount, 500);
  const [isSwapping, setIsSwapping] = useState<boolean>(false); // todo: user reducer
  const [transactionReceipt, setTransactionReceipt] = useState<string>(""); // todo: user reducer

  const [state, dispatch] = useReducer(reducer, initialState);

  const [selectedSellToken, setSelectedSellToken] = useState({
    address: "So11111111111111111111111111111111111111112",
    chainId: 101,
    decimals: 9,
    name: "Wrapped SOL",
    symbol: "SOL",
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
    tags: ["old-registry"],
  });
  const [selectedBuyToken, setSelectedBuyToken] = useState({
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    chainId: 101,
    decimals: 6,
    name: "USD Coin",
    symbol: "USDC",
    logoURI:
      "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
    tags: ["old-registry", "solana-fm"],
  });
  const [sellItems, setSellItems] = useState(
    tokenList.filter((item) => {
      return item.symbol.toLowerCase().includes("sol");
    })
  );

  const [buyItems, setBuyItems] = useState(
    tokenList.filter((item) => {
      return item.symbol.toLowerCase().includes("usdc");
    })
  );

  useEffect(() => {
    if (!publicKey) return;

    async function run() {
      if (!publicKey) return;
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        {
          programId: TOKEN_PROGRAM_ID,
        }
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
    if (!selectedBuyToken || !selectedSellToken) return;

    const amountInSmallestUnit =
      Number(debouncedSellAmount) * Math.pow(10, selectedSellToken.decimals);

    const searchParams = new URLSearchParams({
      slippageBps: "25",
      onlyDirectRoutes: "false",
      asLegacyTransaction: "false",
      inputMint: selectedSellToken.address,
      outputMint: selectedBuyToken.address,
      amount: amountInSmallestUnit.toString(),
    }).toString();

    const url = `/quote?${searchParams}`;

    async function fetchQuote() {
      setIsFetchingQuote(true);
      const response = await fetch(url);
      const data = await response.json();

      dispatch({ type: "set quote response", payload: data });

      setBuyAmount(
        lamportsToTokenUnits(
          Number(data.outAmount),
          selectedBuyToken.decimals
        ).toString()
      );
      setIsFetchingQuote(false);
    }

    fetchQuote();
  }, [debouncedSellAmount, selectedBuyToken, selectedSellToken]);

  useEffect(() => {
    async function run() {
      if (publicKey) {
        const balance = await connection.getBalance(
          new PublicKey(publicKey.toString())
        );

        const uiAmount = lamportsToTokenUnits(balance, 9);

        setNativeBalance({
          uiAmount,
          uiAmountString: uiAmount.toString(),
          amount: balance.toString(),
          decimals: 9,
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
        return v.account.data.parsed.info.mint === selectedSellToken.address;
      });

      if (balance) {
        return balance.account.data.parsed.info.tokenAmount;
      }
    }

    return undefined;
  }, [state.tokenAccounts, selectedSellToken]);

  const balanceUi =
    selectedSellToken.address === "So11111111111111111111111111111111111111112"
      ? nativeBalance
      : sellBalanceSPL;

  const [sellInputValue, setSellInputValue] = useState<string>(
    selectedSellToken.symbol
  );

  const [buyInputValue, setBuyInputValue] = useState<string>(
    selectedBuyToken.symbol
  );

  return (
    <main
      style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}
      className="sm:max-w-2xl mx-auto text-lg mt-10 sm:mt-40"
    >
      <section>
        <h1 className="text-center text-4xl mt-6 mb-3">solswap</h1>
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
                  className="w-12 h-12 m-0 p-0 mr-3 rounded-full"
                  src={selectedSellToken.logoURI}
                  alt="sol"
                />
                <Input
                  type="text"
                  name="sol"
                  placeholder="0.0"
                  value={sellAmount}
                  inputMode="decimal"
                  autoComplete="off"
                  autoCorrect="off"
                  pattern="^[0-9]*[.,]?[0-9]*$"
                  minLength={1}
                  id="sell-input"
                  maxLength={50}
                  spellCheck="false"
                  className="px-3 py-2 rounded-lg border w-full border-purple-800 outline-none outline-2 outline-dotted  focus-visible:outline-purple-900"
                  onChange={(e) => {
                    if (/^[0-9]*\.?[0-9]*$/.test(e.target.value)) {
                      setSellAmount(e.target.value.trim());
                    }
                    if (e.target.value === "") {
                      setBuyAmount("");
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
              // menuTrigger="focus"
              items={sellItems}
              onInputChange={(value: string) => {
                setSellInputValue(value);
                const filteredList = tokenList.filter((token) => {
                  return token.symbol
                    .toLowerCase()
                    .includes(value.toLowerCase());
                });
                setSellItems(filteredList.slice(0, 7));
              }}
              inputValue={sellInputValue}
              selectedKey={selectedSellToken.address}
              onSelectionChange={(id) => {
                const selectedItem = sellItems.find((o) => o.address === id);
                if (!selectedItem) return;

                // if selected item is the same as the buy token, swap them
                if (selectedItem?.address === selectedBuyToken.address) {
                  setSelectedBuyToken(selectedSellToken);
                  setSelectedSellToken(selectedBuyToken);
                  setSellInputValue(selectedBuyToken.symbol);
                  setBuyInputValue(selectedSellToken.symbol);
                } else {
                  setSelectedSellToken(selectedItem);
                  setSellInputValue(selectedItem.symbol);
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
                  {(item: {
                    address: string;
                    chainId: number;
                    decimals: number;
                    name: string;
                    symbol: string;
                    logoURI: string;
                    tags: string[];
                    extensions: any;
                  }) => (
                    <ListBoxItem
                      textValue={item.symbol}
                      key={item.address}
                      id={item.address}
                      className="flex font-sans items-center px-4 py-3 cursor-pointer outline-none border-0 border-none rounded-md data-[hovered]:bg-purple-900 data-[hovered]:dark:bg-purple-800 data-[hovered]:text-white data-[disabled]:bg-gray-100"
                    >
                      <img
                        src={item.logoURI}
                        alt={item.symbol}
                        style={{ width: "1.5rem", height: "1.5rem" }}
                        className="rounded-full"
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
              className="border-purple-800 outline-none outline-2 outline-dotted  focus-visible:outline-purple-900"
              disabled={isSwapping || isFetchingQuote}
              onClick={() => {
                setSelectedBuyToken(selectedSellToken);
                setSelectedSellToken(selectedBuyToken);
                setSellInputValue(selectedBuyToken.symbol);
                setBuyInputValue(selectedSellToken.symbol);
                setSellItems(buyItems);
                setBuyItems(sellItems);
              }}
            />
          </div>
          <div className="sm:flex sm:items-center sm:justify-between bg-green-300 rounded-bl-lg rounded-br-lg p-4">
            <div className="sm:mr-12">
              <div>
                <label htmlFor="buy-input" className="text-base font-semibold">
                  You receive
                </label>
                <div className="flex items-center">
                  <img
                    className="w-12 h-12 m-0 p-0 mr-3 rounded-full"
                    src={selectedBuyToken.logoURI}
                    alt="sol"
                  />
                  <input
                    disabled
                    type="text"
                    id="buy-input"
                    name="buy-input"
                    value={buyAmount}
                    placeholder="0.0"
                    onChange={() => {}}
                    className="px-3 py-2 rounded-lg border cursor-not-allowed bg-gray-200 w-full"
                  />
                </div>
              </div>
            </div>

            <div>
              <ComboBox
                items={buyItems}
                onInputChange={(value: string) => {
                  setBuyInputValue(value);
                  const newItems = tokenList.filter((token) => {
                    return token.symbol
                      .toLowerCase()
                      .includes(value.toLowerCase());
                  });
                  setBuyItems(newItems.slice(0, 7));
                }}
                inputValue={buyInputValue}
                selectedKey={selectedBuyToken.address}
                onSelectionChange={(id) => {
                  const selectedItem = buyItems.find((o) => o.address === id);
                  if (!selectedItem) return;

                  // if selected item is the same as the buy token, swap them
                  if (selectedItem?.address === selectedSellToken.address) {
                    setSelectedBuyToken(selectedSellToken);
                    setSelectedSellToken(selectedBuyToken);
                    setSellInputValue(selectedBuyToken.symbol);
                    setBuyInputValue(selectedSellToken.symbol);
                  } else {
                    selectedItem && setSelectedBuyToken(selectedItem);
                    selectedItem && setBuyInputValue(selectedItem.symbol);
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
                    {(item: {
                      address: string;
                      chainId: number;
                      decimals: number;
                      name: string;
                      symbol: string;
                      logoURI: string;
                      tags: string[];
                      extensions: any;
                    }) => (
                      <ListBoxItem
                        textValue={item.symbol}
                        key={item.address}
                        id={item.address}
                        className="flex font-sans items-center px-4 py-3 cursor-pointer outline-none border-0 border-none rounded-md data-[hovered]:bg-purple-900 data-[hovered]:dark:bg-purple-800 data-[hovered]:text-white data-[disabled]:bg-gray-100"
                      >
                        <img
                          src={item.logoURI}
                          alt={item.symbol}
                          style={{ width: "1.5rem", height: "1.5rem" }}
                          className="rounded-full"
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
          <br />
          <div className="px-4 sm:px-0">
            {connected ? (
              <button
                type="button"
                className={`border-green-800 outline-none outline-2 outline-dotted  focus-visible:outline-green-900 text-lg rounded-lg text-slate-50 transition-all duration-200 bg-purple-900 dark:bg-purple-900 disabled:text-slate-100 disabled:opacity-50 hover:bg-purple-600 active:bg-purple-700 dark:hover:bg-purple-900/75 dark:active:bg-purple-900/50 py-3 w-full ${
                  !state.quoteResponse || isSwapping || !publicKey
                    ? "cursor-not-allowed"
                    : "cursor-pointer"
                }`}
                disabled={!state.quoteResponse || isSwapping || isFetchingQuote}
                onClick={async () => {
                  if (!state.quoteResponse) return;

                  try {
                    setIsSwapping(true);
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
                    receipt && setTransactionReceipt(receipt.signature);
                    console.info(`Transaction sent: ${receipt?.signature}`);
                  } catch (err) {
                    console.error(err);
                  } finally {
                    // reset
                    setSellAmount("");
                    setBuyAmount("");
                    dispatch({
                      type: "set quote response",
                      payload: undefined,
                    });
                    setIsSwapping(false);
                  }
                }}
              >
                {isFetchingQuote
                  ? "Getting best price…"
                  : isSwapping
                  ? "Swapping…"
                  : "Swap"}
              </button>
            ) : (
              <button
                className="border-green-800 outline-none outline-2 outline-dotted  focus-visible:outline-green-900 text-lg rounded-lg text-slate-50 transition-all duration-200 bg-purple-900 dark:bg-purple-900 disabled:text-slate-100 disabled:opacity-50 hover:bg-purple-600 active:bg-purple-700 dark:hover:bg-purple-900/75 dark:active:bg-purple-900/50 py-3 w-full"
                onClick={() => {
                  setVisible(true);
                }}
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
                setTransactionReceipt("");
              }}
              className="mr-3 w-18 h-10 py-1 px-3 rounded-md border flex items-center justify-center transition-colors duration-250 border-none dark:hover:bg-blue-marguerite-900 dark:pressed:bg-blue-marguerite-700"
            >
              <span>Close</span>
            </Button>
            <Button className="text-white w-18 h-10 py-1 px-3 rounded-md border flex items-center justify-center outline-none outline-2 outline-dotted  focus-visible:outline-purple-300 transition-colors duration-250 bg-purple-800 hover:bg-purple-800/95 pressed:bg-purple-950 border-purple-950">
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={`https://explorer.solana.com/tx/${transactionReceipt}`}
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
