import {
  Button,
  ComboBox,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Text,
} from "react-aria-components";
import type { MetaFunction, LinksFunction } from "@remix-run/node";
import { useEffect, useMemo, useRef, useState } from "react";
import { VersionedTransaction, PublicKey } from "@solana/web3.js";
import { Form } from "@remix-run/react";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import type { PhantomWallet } from "~/types";
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

type Context = {
  slot: number;
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

type ParsedAccountData = {
  /** Name of the program that owns this account */
  program: string;
  /** Parsed account data */
  parsed: any;
  /** Space used by account data */
  space: number;
};

type X = RpcResponseAndContext<
  Array<{
    pubkey: PublicKey;
    account: AccountInfo<ParsedAccountData>;
  }>
>;

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
  /*
  {
    tokenAccounts: {},
    sellAmount: "",
    buyAmount: "",
    quoteResponse: {}
    
  }
  */
  const [isFetchingQuote, setIsFetchingQuote] = useState(false);
  const [nativeBalance, setNativeBalance] = useState<any>();
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [tokenAccounts, setTokenAccounts] = useState<X>();
  const [sellAmount, setSellAmount] = useState<string>("");
  const [buyAmount, setBuyAmount] = useState<string>("");
  const debouncedSellAmount: string = useDebounce(sellAmount, 500);
  const [quoteResponse, setQuoteResponse] = useState<any>(null);
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const [transactionReceipt, setTransactionReceipt] = useState<string>("");

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

      setTokenAccounts(tokenAccounts);
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
      setQuoteResponse(data);

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

        console.log(lamportsToTokenUnits(balance, 9), "<--balance");

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
    if (tokenAccounts) {
      const [balance] = tokenAccounts.value.filter((v) => {
        return v.account.data.parsed.info.mint === selectedSellToken.address;
      });

      if (balance) {
        return balance.account.data.parsed.info.tokenAmount;
      }
    }

    return undefined;
  }, [tokenAccounts, selectedSellToken]);

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
      className="sm:max-w-2xl mx-auto text-lg"
    >
      <section>
        <h1 className="text-center text-4xl mt-6 mb-3">solswap</h1>
        <Form>
          <div className="sm:flex sm:justify-between bg-purple-100 sm:rounded-tl-lg sm:rounded-tr-lg p-4 pb-8 sm:pb-4">
            <div>
              <label htmlFor="sell-input" className="text-base">
                You sell:
              </label>
              <div className="flex w-full">
                <img
                  className="w-12 h-12 m-0 p-0 mr-3 rounded-full"
                  src={selectedSellToken.logoURI}
                  alt="sol"
                />
                <input
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
                  className="px-3 py-2 rounded-lg border w-full"
                  onChange={(e) => {
                    if (/^[0-9]*\.?[0-9]*$/.test(e.target.value)) {
                      setSellAmount(e.target.value.trim());
                    }
                    if (e.target.value === "") {
                      setBuyAmount("");
                      setQuoteResponse(null);
                    }
                  }}
                />
              </div>
              <Text className="text-xs block mt-2 text-end">
                Balance: {balanceUi?.uiAmountString}
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
              <Label className="text-xs">Search for any token</Label>
              <div>
                <Input className="px-3 py-2 rounded-lg border w-full" />
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
              className=""
              disabled={isSwapping || isFetchingQuote}
            />
          </div>
          <div className="sm:flex sm:items-center sm:justify-between bg-green-100 rounded-bl-lg rounded-br-lg p-4">
            <div className="sm:mr-12">
              <div>
                <label htmlFor="buy-input" className="text-base">
                  You receive:
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
                <Label className="text-xs">Search for any token</Label>
                <div>
                  <Input className="px-3 py-2 rounded-lg border w-full" />
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
            <button
              type="button"
              className={`text-lg rounded-lg text-slate-50 transition-all duration-200 bg-purple-900 dark:bg-purple-900 disabled:text-slate-100 disabled:opacity-50 hover:bg-purple-600 active:bg-purple-700 dark:hover:bg-purple-900/75 dark:active:bg-purple-900/50 py-3 w-full ${
                !quoteResponse || isSwapping || !connected || !publicKey
                  ? "cursor-not-allowed"
                  : "cursor-pointer"
              }`}
              disabled={
                !quoteResponse || isSwapping || !connected || !publicKey
              }
              onClick={async () => {
                if (!quoteResponse) return;

                try {
                  setIsSwapping(true);
                  const { swapTransaction } = await (
                    await fetch("/swap", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        quoteResponse,
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
                  setQuoteResponse(null);
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
          </div>
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
      </section>
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
