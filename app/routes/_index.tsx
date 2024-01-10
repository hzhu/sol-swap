import { useReducer } from "react";
import Confetti from "react-confetti";
import { Form } from "@remix-run/react";
import { erc20Abi, formatUnits, parseUnits } from "viem";
import {
  useAccount,
  useEnsName,
  useReadContract,
  useSwitchChain,
  useWriteContract,
  useSendTransaction,
} from "wagmi";
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
  Tabs,
  TabList,
  Tab,
  TabPanel,
} from "react-aria-components";
import { initialState, reducer } from "~/reducer";
import { subtractFloats, lamportsToTokenUnits } from "~/utils";
import {
  Spinner,
  BottomSheetTokenSearch,
  BottomSheetTrigger,
  DirectionButton,
  Chevron,
} from "~/components";
import {
  useQuote,
  useBalance,
  useDebounce,
  useProvider,
  useTokenBalance,
  useFeature,
} from "~/hooks";
import { WSOL } from "~/constants";
import type { Address } from "viem";
import type { MetaFunction, LinksFunction } from "@remix-run/node";
import type { Token, QuoteResponseLiFi } from "~/types";
import tailwindStyles from "~/styles/tailwind.css";
import reactAriaStyles from "~/styles/react-aria.css";
import solanaWalletStyles from "~/styles/solana-wallet.css";
import { useQuery } from "@tanstack/react-query";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: tailwindStyles },
  { rel: "stylesheet", href: reactAriaStyles },
  { rel: "stylesheet", href: solanaWalletStyles },
];

export const meta: MetaFunction = () => {
  return [
    { title: "Solana Swap" },
    { name: "description", content: "Swap tokens on Solana!" },
  ];
};

export default function Index() {
  const hasBridgeFeature = useFeature("bridge");
  const { chain } = useAccount();
  const { chains, switchChain } = useSwitchChain();
  return (
    <main className="sm:max-w-lg mx-auto text-lg mt-10 sm:mt-40">
      {hasBridgeFeature && (
        <>
          <div>You are connected to: {chain?.name}</div>
          {chains.map((chain) => (
            <button
              key={chain.id}
              onClick={() => switchChain({ chainId: chain.id })}
            >
              {chain.name}
            </button>
          ))}
        </>
      )}
      <section className="px-2">
        <h1 className="text-center text-4xl mt-6 mb-3">sol swap</h1>
        <Tabs defaultSelectedKey="bridge">
          <TabList aria-label="History of Ancient Rome">
            <Tab id="swap" className={hasBridgeFeature ? "mx-4" : "hidden"}>
              Swap 🔁
            </Tab>
            <Tab id="bridge" className={hasBridgeFeature ? "" : "hidden"}>
              Bridge 🌉
            </Tab>
          </TabList>
          <TabPanel id="swap">
            <Swap />
          </TabPanel>
          <TabPanel id="bridge">
            <Bridge />
          </TabPanel>
        </Tabs>
      </section>
    </main>
  );
}

const polygonUsdc = {
  address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
  decimals: 6,
  chainId: 137,
  logoURI:
    "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
  name: "USD Coin",
  symbol: "USDC",
};

const solanaUsdc = {
  address: "So11111111111111111111111111111111111111112",
  decimals: 9,
  chainId: "SOL",
  logoURI:
    "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
  name: "USD Coin",
  symbol: "USDC",
};

export interface Token2 {
  // TODO: rename
  address: string;
  chainId: number | string;
  decimals: number;
  name: string;
  symbol: string;
  logoURI: string;
  tags?: string[];
}

type ActionTypes =
  | {
      type: "set input amount";
      payload: string;
    }
  | {
      type: "set output amount";
      payload: string;
    };

export const bridgeReducer = (
  state: BridgeReducerState,
  action: ActionTypes
) => {
  switch (action.type) {
    case "set input amount":
      return {
        ...state,
        inputAmount: action.payload,
      };
    case "set output amount":
      return {
        ...state,
        outputAmount: action.payload,
      };
    default:
      return state;
  }
};

interface BridgeReducerState {
  sellToken: Token2;
  buyToken: Token2;
  inputAmount: string;
  outputAmount: string;
  transactionReceipt: string;
  isApproving: boolean; // might not need this in state; can come directly from react-query
  isSwapping: boolean; // might not need this in state; can come directly from react-query
}

const initialStateBridge = {
  sellToken: polygonUsdc,
  buyToken: solanaUsdc,
  inputAmount: "",
  outputAmount: "",
  transactionReceipt: "",
  isApproving: false,
  isSwapping: false,
};

function Bridge() {
  const [state, dispatch] = useReducer(bridgeReducer, initialStateBridge);
  const debouncedSellAmount: string = useDebounce(state.inputAmount, 500);

  const fromAmount = parseUnits(
    debouncedSellAmount,
    state.sellToken.decimals
  ).toString();

  const { address } = useAccount();
  const { data: ensName } = useEnsName({ address });
  const { connected } = useWallet();

  const fromAddress = "0x8a6BFCae15E729fd1440574108437dEa281A9B3e"; // taker addy on POL
  const toAddress = "3zSiMfexWoWY8Yjvpd2bofNrUiCfH2S5Q9a7BwqiGUqM"; // taker addy on SOL

  const query = useQuery<QuoteResponseLiFi>({
    queryKey: [fromAmount],
    enabled: fromAmount !== "0",
    queryFn: async ({ queryKey }) => {
      const [fromAmount] = queryKey;
      const response = await fetch(
        `https://li.quest/v1/quote?fromChain=POL&toChain=1151111081099710&fromToken=${polygonUsdc.address}&toToken=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&fromAddress=${fromAddress}&toAddress=${toAddress}&fromAmount=${fromAmount}&slippage=0.01`
      );
      return response.json();
    },
  });

  const outputAmount = query.data
    ? formatUnits(
        BigInt(query.data.estimate.toAmount),
        state.sellToken.decimals
      )
    : "";

  const approvalAddress = "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE"; // from LiFi quote

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359", // usdc on polygon
    abi: erc20Abi,
    functionName: "allowance",
    args: [fromAddress, approvalAddress],
  });

  const { writeContractAsync } = useWriteContract();

  const fromAmountFromQuote = query.data?.estimate.fromAmount;

  const requiresApproval =
    allowance && fromAmountFromQuote
      ? allowance < BigInt(fromAmountFromQuote)
      : false;

  const approve = async () => {
    if (!fromAmountFromQuote) return;

    await writeContractAsync({
      abi: erc20Abi,
      functionName: "approve",
      address: polygonUsdc.address as Address,
      args: [approvalAddress, BigInt(fromAmountFromQuote)],
    });

    refetchAllowance();
  };

  const { sendTransactionAsync } = useSendTransaction();

  return (
    <Form>
      <span>{ensName}</span>
      <div className="bg-purple-300 flex items-center justify-between rounded-2xl px-3 h-28 mb-1">
        <label
          htmlFor="sell-input"
          className="text-base cursor-pointer font-semibold w-2/3"
        >
          <div>From Polygon</div>
          <Input
            autoFocus
            name="sell-input"
            type="text"
            minLength={1}
            maxLength={50}
            id="sell-input"
            placeholder="0.0"
            autoCorrect="off"
            autoComplete="off"
            spellCheck="false"
            inputMode="decimal"
            value={state.inputAmount}
            pattern="^[0-9]*[.,]?[0-9]*$"
            className="pl-1 pr-8 pt-2 pb-3 rounded-lg border-0 w-full outline-none bg-transparent text-3xl"
            onChange={(e) => {
              if (/^[0-9]*\.?[0-9]*$/.test(e.target.value)) {
                dispatch({
                  type: "set input amount",
                  payload: e.target.value.trim(),
                });
              }
              if (e.target.value === "") {
                dispatch({ type: "set output amount", payload: "" });
              }
            }}
          />
        </label>
        <div className="flex items-end ml-3 flex-col justify-center">
          <BottomSheetTokenSearch onSelect={(token: Token) => {}}>
            <BottomSheetTrigger className="flex items-center bg-purple-700/90 text-white rounded-full p-1 data-[pressed]:bg-purple-900 data-[hovered]:bg-purple-800 outline-none data-[focus-visible]:outline-2 data-[focus-visible]:outline-dotted data-[focus-visible]:outline-purple-900">
              <img
                alt="USDC"
                src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png"
                className="w-8 h-8 m-0 p-0 rounded-full"
              />
              <span className="mx-2">USDC</span>
              <Chevron />
            </BottomSheetTrigger>
          </BottomSheetTokenSearch>
        </div>
      </div>
      <div className="flex justify-center items-center h-0 relative bottom-2">
        <DirectionButton
          // isDisabled={state.isSwapping || isFetchingQuote}
          onPress={() => {}}
          className="disabled:bg-purple-400 disabled:text-purple-600 bg-purple-700 data-[pressed]:bg-purple-900 data-[hovered]:bg-purple-800 outline-none data-[focus-visible]:outline-2 data-[focus-visible]:outline-dotted data-[focus-visible]:outline-purple-900"
        />
      </div>
      <div className="bg-slate-300 flex items-center justify-between rounded-2xl px-3 h-28 cursor-not-allowed">
        <label
          htmlFor="buy-input"
          className="text-base cursor-not-allowed font-semibold w-2/3"
        >
          <div>To Solana</div>
          <Input
            disabled
            type="text"
            id="buy-input"
            name="buy-input"
            placeholder="0.0"
            value={outputAmount}
            className="pl-1 pr-8 pt-2 pb-3 rounded-lg border-0 w-full outline-none bg-transparent text-3xl cursor-not-allowed"
          />
        </label>
        <div className="flex items-end ml-3 flex-col justify-center">
          <BottomSheetTokenSearch onSelect={(token) => {}}>
            <BottomSheetTrigger className="flex items-center bg-purple-700 text-white rounded-full p-1 data-[pressed]:bg-purple-900 data-[hovered]:bg-purple-800 outline-none data-[focus-visible]:outline-2 data-[focus-visible]:outline-dotted data-[focus-visible]:outline-purple-900">
              <img
                alt="USDC"
                src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png"
                className="w-8 h-8 m-0 p-0 rounded-full"
              />
              <span className="mx-2">USDC</span>
              <Chevron />
            </BottomSheetTrigger>
          </BottomSheetTokenSearch>
        </div>
      </div>
      <div className="hidden text-center bg-red-200 mt-1 border border-red-600 rounded-xl py-2 text-sm sm:text-base">
        ⚠️ Error message
      </div>
      <div className="my-1">
        {!connected ? (
          <Button
            onPress={() => {}}
            className="outline-2 outline-dotted text-lg rounded-lg text-slate-50 transition-all duration-200  disabled:text-slate-100 disabled:opacity-50 py-3 w-full bg-purple-700 data-[pressed]:bg-purple-900 data-[hovered]:bg-purple-800 outline-none data-[focus-visible]:outline-2 data-[focus-visible]:outline-dotted data-[focus-visible]:outline-purple-900"
          >
            Connect Wallet
          </Button>
        ) : (
          <Button
            onPress={() => {
              if (requiresApproval) {
                approve();
              } else {
                if (!query.data) return;
                const { transactionRequest } = query.data;
                const { chainId, data, gasPrice, to, value } =
                  transactionRequest;
                sendTransactionAsync({
                  to,
                  account: fromAddress,
                  type: "eip1559",
                  gasPrice: gasPrice,
                  chainId: chainId,
                  data: data,
                  value: value,
                });
              }
            }}
            className="outline-2 outline-dotted text-lg rounded-lg text-slate-50 transition-all duration-200  disabled:text-slate-100 disabled:opacity-50 py-3 w-full bg-purple-700 data-[pressed]:bg-purple-900 data-[hovered]:bg-purple-800 outline-none data-[focus-visible]:outline-2 data-[focus-visible]:outline-dotted data-[focus-visible]:outline-purple-900"
          >
            {requiresApproval ? "Approve" : "Bridge"}
          </Button>
        )}
      </div>
    </Form>
  );
}

function Swap() {
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

  const isSellingSol = sellToken.address === WSOL;

  const balanceUi = isSellingSol ? balance : tokenBalance;

  const insufficientBalance =
    (!balanceUi ? 0 : balanceUi.uiAmount) <
    lamportsToTokenUnits(Number(quote?.inAmount), sellToken.decimals);

  return (
    <>
      <Form>
        <div className="bg-purple-300 flex items-center justify-between rounded-2xl px-3 h-28 mb-1">
          <label
            htmlFor="sell-input"
            className="text-base cursor-pointer font-semibold w-2/3"
          >
            <div>Sell</div>
            <Input
              autoFocus
              name="sell-input"
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
              <BottomSheetTrigger className="flex items-center bg-purple-700/90 text-white rounded-full p-1 data-[pressed]:bg-purple-900 data-[hovered]:bg-purple-800 outline-none data-[focus-visible]:outline-2 data-[focus-visible]:outline-dotted data-[focus-visible]:outline-purple-900">
                <img
                  alt={sellToken.name}
                  src={sellToken.logoURI}
                  className="w-8 h-8 m-0 p-0 rounded-full"
                />
                <span className="mx-2">{sellToken.symbol}</span>
                <Chevron />
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
            isDisabled={state.isSwapping || isFetchingQuote}
            onPress={() => dispatch({ type: "reverse trade direction" })}
            className="disabled:bg-purple-400 disabled:text-purple-600 bg-purple-700 data-[pressed]:bg-purple-900 data-[hovered]:bg-purple-800 outline-none data-[focus-visible]:outline-2 data-[focus-visible]:outline-dotted data-[focus-visible]:outline-purple-900"
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
              onSelect={(token) => {
                dispatch({ type: "set buy token", payload: token });
              }}
            >
              <BottomSheetTrigger className="flex items-center bg-purple-700 text-white rounded-full p-1 data-[pressed]:bg-purple-900 data-[hovered]:bg-purple-800 outline-none data-[focus-visible]:outline-2 data-[focus-visible]:outline-dotted data-[focus-visible]:outline-purple-900">
                <img
                  alt={buyToken.name}
                  src={buyToken.logoURI}
                  className="w-8 h-8 m-0 p-0 rounded-full"
                />
                <span className="mx-2">{buyToken.symbol}</span>
                <Chevron />
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
            <Button
              onPress={() => setVisible(true)}
              className="outline-2 outline-dotted text-lg rounded-lg text-slate-50 transition-all duration-200  disabled:text-slate-100 disabled:opacity-50 py-3 w-full bg-purple-700 data-[pressed]:bg-purple-900 data-[hovered]:bg-purple-800 outline-none data-[focus-visible]:outline-2 data-[focus-visible]:outline-dotted data-[focus-visible]:outline-purple-900"
            >
              Connect Wallet
            </Button>
          )}
        </div>
      </Form>
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
    </>
  );
}
