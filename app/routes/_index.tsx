import {
  Button,
  ComboBox,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
} from "react-aria-components";
import type { MetaFunction } from "@remix-run/node";
import { useEffect, useMemo, useRef, useState } from "react";
import { VersionedTransaction, PublicKey } from "@solana/web3.js";
import { Form } from "@remix-run/react";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import type { PhantomWallet } from "~/types";
import { tokenList } from "~/tokenList";

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
  const [items, setItems] = useState([
    {
      address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      chainId: 101,
      decimals: 6,
      name: "USD Coin",
      symbol: "USDC",
      logoURI:
        "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
      tags: ["old-registry", "solana-fm"],
    },
    {
      address: "So11111111111111111111111111111111111111112",
      chainId: 101,
      decimals: 9,
      name: "Wrapped SOL",
      symbol: "SOL",
      logoURI:
        "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
      tags: ["old-registry"],
      extensions: { coingeckoId: "wrapped-solana" },
    },
  ]);

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

    const baseUrl = "https://quote-api.jup.ag/v6/quote";

    // TODO: get decimals from token list
    const amountInSmallestUnit =
      Number(debouncedSellAmount) * Math.pow(10, selectedSellToken.decimals);

    const params = {
      inputMint: selectedSellToken.address,
      outputMint: selectedBuyToken.address,
      amount: amountInSmallestUnit.toString(),
      slippageBps: "25",
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

      setBuyAmount(
        lamportsToTokenUnits(
          Number(data.outAmount),
          selectedBuyToken.decimals
        ).toString()
      );
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
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <h1>solswap</h1>
      <Form>
        <ComboBox
          items={items}
          onInputChange={(value: string) => {
            setSellInputValue(value);
            const filteredList = tokenList.filter((token) => {
              return token.symbol.toLowerCase().includes(value.toLowerCase());
            });
            setItems(filteredList.slice(0, 7));
          }}
          inputValue={sellInputValue}
          selectedKey={selectedSellToken.address}
          onSelectionChange={(id) => {
            const selectedItem = items.find((o) => o.address === id);
            if (selectedItem) {
              setSelectedSellToken(selectedItem);
              setSellInputValue(selectedItem.symbol);
            }
          }}
        >
          <Label>Chose a sell token</Label>
          <div>
            <Input className="px-3 py-2" />
            <Button>▼</Button>
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
                  className="flex items-center px-4 py-3 cursor-pointer outline-none border-0 border-none rounded-md data-[hovered]:bg-blue-400 data-[hovered]:dark:bg-blue-marguerite-600 data-[hovered]:text-white data-[disabled]:bg-gray-100"
                >
                  <img
                    src={item.logoURI}
                    alt={item.symbol}
                    style={{ width: "1.5rem", height: "1.5rem" }}
                  />
                  &nbsp;
                  <span>{item.symbol}</span>
                </ListBoxItem>
              )}
            </ListBox>
          </Popover>
        </ComboBox>
        <label className="">Sell</label>
        <input
          type="text"
          name="sol"
          placeholder="0.0"
          value={sellAmount}
          onChange={(e) => {
            setSellAmount(e.target.value.trim());
          }}
        />
        <div className="text-xs">Balance: {balanceUi?.uiAmountString}</div>
        <br />
        <br />
        <br />
        <ComboBox
          items={items}
          onInputChange={(value: string) => {
            setBuyInputValue(value);
            const newItems = tokenList.filter((token) => {
              return token.symbol.toLowerCase().includes(value.toLowerCase());
            });
            setItems(newItems.slice(0, 7));
          }}
          inputValue={buyInputValue}
          selectedKey={selectedBuyToken.address}
          onSelectionChange={(id) => {
            const selectedItem = items.find((o) => o.address === id);
            selectedItem && setSelectedBuyToken(selectedItem);
            selectedItem && setBuyInputValue(selectedItem.symbol);
          }}
        >
          <Label>Chose a buy token</Label>
          <div>
            <Input className="px-3 py-2" />
            <Button>▼</Button>
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
                  className="px-1 py-1 cursor-pointer outline-none border-0 border-none rounded-md data-[hovered]:bg-blue-400 data-[hovered]:dark:bg-blue-marguerite-600 data-[hovered]:text-white data-[disabled]:bg-gray-100"
                >
                  <img
                    src={item.logoURI}
                    alt={item.symbol}
                    style={{ width: "1.5rem", height: "1.5rem" }}
                  />
                  <span>{item.symbol}</span>
                </ListBoxItem>
              )}
            </ListBox>
          </Popover>
        </ComboBox>
        <label htmlFor="buy-input">buy</label>
        <input
          type="text"
          id="buy-input"
          name="buy-input"
          value={buyAmount}
          disabled
          onChange={() => {}}
        />
        <br />
        <br />
        <button
          type="button"
          disabled={!quoteResponse || isSwapping || !connected || !publicKey}
          onClick={async () => {
            console.log(quoteResponse);
            return;
            // if (!quoteResponse) return;

            // try {
            //   setIsSwapping(true);
            //   // get serialized transactions for the swap
            //   const { swapTransaction } = await (
            //     await fetch("https://quote-api.jup.ag/v6/swap", {
            //       method: "POST",
            //       headers: { "Content-Type": "application/json" },
            //       body: JSON.stringify({
            //         quoteResponse,
            //         userPublicKey: publicKey,
            //         wrapAndUnwrapSol: true,
            //       }),
            //     })
            //   ).json();

            //   const swapTransactionBuf = Buffer.from(swapTransaction, "base64");

            //   const versionedTx =
            //     VersionedTransaction.deserialize(swapTransactionBuf);

            //   const receipt = await providerRef.current?.signAndSendTransaction(
            //     versionedTx
            //   );
            //   receipt && setTransactionReceipt(receipt.signature);
            // } catch (err) {
            //   console.error(err);
            // } finally {
            //   // reset
            //   setSellAmount("");
            //   setBuyAmount("");
            //   setQuoteResponse(null);
            //   setIsSwapping(false);
            // }
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
