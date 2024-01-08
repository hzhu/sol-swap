import { useSwitchChain, useAccount, useEnsName, useReadContract } from "wagmi";

import { erc20Abi } from "viem";
import { LiFi } from "@lifi/sdk";
import { useEffect, useReducer, useRef } from "react";
import Confetti from "react-confetti";
import { Form } from "@remix-run/react";
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
import {
  subtractFloats,
  lamportsToTokenUnits,
  getProviderEthereum,
} from "~/utils";
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
} from "~/hooks";
import { WSOL } from "~/constants";
import type { MetaFunction, LinksFunction } from "@remix-run/node";
import type { Token } from "~/types";
import tailwindStyles from "~/styles/tailwind.css";
import reactAriaStyles from "~/styles/react-aria.css";
import solanaWalletStyles from "~/styles/solana-wallet.css";
import {
  AllbridgeCoreSdk,
  nodeRpcUrlsDefault,
  ChainSymbol,
} from "@allbridge/bridge-core-sdk";

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

export function ensure<T>(argument: T | undefined | null): T {
  if (argument === undefined || argument === null) {
    throw new TypeError("This value was promised to be there.");
  }

  return argument;
}

export default function Index() {
  const { address, chain } = useAccount();
  console.log(chain, "<-chain");
  const { data } = useEnsName({ address });

  if (address) {
    console.info(address);
  }

  if (data) {
    console.info(data);
  }

  const provider = useProvider();

  const ethProviderRef = useRef();

  useEffect(() => {
    const ethereumProvider = getProviderEthereum();
    ethProviderRef.current = ethereumProvider;

    async function run() {
      const accounts = await ethereumProvider.request({
        method: "eth_requestAccounts",
      });
    }

    ethereumProvider.on("connect", (connectionInfo: { chainId: string }) =>
      console.log(`Connected to chain: ${connectionInfo.chainId}`)
    );

    const sdk = new AllbridgeCoreSdk({
      ...nodeRpcUrlsDefault,
      ETH: "https://eth-mainnet.g.alchemy.com/v2/8bRc1YQ14fkTaLkVRNTgt1QhjqMihKfc",
      POL: "https://polygon-mainnet.infura.io/v3/4eacd368c4c14bd3a4c6a40ba0e20237",
    });

    async function allBridgeTrash() {
      const supportedChains = await sdk.chainDetailsMap();
      // extract information about ETH chain
      const { bridgeAddress, tokens, chainId, name } = supportedChains["POL"];
      // Choose one of the tokens supported on ETH
      // console.log(bridgeAddress, tokens, chainId, name);
      // const usdtOnEthToken = tokens.find((token) => token.symbol === "USDT");

      const chains = await sdk.chainDetailsMap();

      const sourceChain = chains[ChainSymbol.POL];
      const sourceTokenInfo = ensure(
        sourceChain.tokens.find((tokenInfo) => tokenInfo.symbol === "USDC")
      );

      const destinationChainPol = chains[ChainSymbol.SOL];
      const destinationTokenInfo = ensure(
        destinationChainPol.tokens.find(
          (tokenInfo) => tokenInfo.symbol === "USDC"
        )
      );

      const [accountAddress] = await ethProviderRef.current?.request({
        method: "eth_requestAccounts",
      });

      // console.log(sourceTokenInfo, "<--sourceTokenInfo");
      // console.log("-------------------");
      // console.log(destinationTokenInfo, "<--destinationTokenInfo");

      const response = await sdk.bridge.approve(provider, {
        token: sourceTokenInfo,
        owner: accountAddress,
      });

      console.log(response, "<--response");
    }

    const fromAddress = "0x8a6BFCae15E729fd1440574108437dEa281A9B3e"; // addy on POL
    const toAddress = "3zSiMfexWoWY8Yjvpd2bofNrUiCfH2S5Q9a7BwqiGUqM"; // addy on SOL
    const usdcCircleOnPol = "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359";
    const usdcBridgedOnPol = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";

    async function lifi() {
      // fetch("https://li.quest/v1/advanced/routes", {
      //   method: "POST",
      //   headers: {
      //     accept: "application/json",
      //     "content-type": "application/json",
      //   },
      //   body: JSON.stringify({
      //     fromChainId: 137,
      //     fromAmount: "1000000",
      //     fromTokenAddress: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
      //     toChainId: "SOL",
      //     toTokenAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      //     fromAddress,
      //     toAddress,
      //     options: {
      //       slippage: 0.01,
      //     },
      //   }),
      // })
      //   .then((response) => response.json())
      //   .then((data) => console.log(data))
      //   .catch((error) => console.error("Error:", error));

      fetch(
        `https://li.quest/v1/quote?fromChain=POL&toChain=1151111081099710&fromToken=${usdcBridgedOnPol}&toToken=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&fromAddress=${fromAddress}&toAddress=${toAddress}&fromAmount=1000000&slippage=0.01`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
          },
        }
      )
        .then((response) => response.json())
        .then((data) => console.log(data, "<--quote data"))
        .catch((error) => console.error("Error:", error));
    }

    run();
    // lifi();
  }, [provider]);

  // useEffect(() => {
  //   const lifi = new LiFi({
  //     integrator: "solswap",
  //   });
  //   const routesRequest = {
  //     fromChainId: "POL",
  //     fromAmount: "1000000",
  //     fromTokenAddress: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359", // USDC on POL,
  //     toChainId: "SOL",
  //     toTokenAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC on SOL,
  //     fromAddress: "0x8a6BFCae15E729fd1440574108437dEa281A9B3e",
  //     toAddress: "3zSiMfexWoWY8Yjvpd2bofNrUiCfH2S5Q9a7BwqiGUqM",
  //     fromAmountForGas: 284126,
  //     options: {
  //       slippage: 0.03,
  //     },
  //   };

  //   export interface RoutesRequest {
  //     fromChainId: number;
  //     fromAmount: string;
  //     fromTokenAddress: string;
  //     fromAddress?: string;
  //     toChainId: number;
  //     toTokenAddress: string;
  //     toAddress?: string;
  //     options?: RouteOptions;
  //     fromAmountForGas?: string;
  // }

  //   async function run() {
  //     console.log("hihi");
  //     const result = await lifi.getRoutes(routesRequest);
  //     console.log(result);
  //   }

  //   run();
  // }, []);

  const takerAddress = "0x8a6BFCae15E729fd1440574108437dEa281A9B3e";
  const approvalAddress = "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE"; // from quote

  // 1. Read from erc20, does spender (0x Exchange Proxy) have allowance?
  const { data: allowance, refetch } = useReadContract({
    address: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359", // usdc on polygon
    abi: erc20Abi,
    functionName: "allowance",
    args: [takerAddress, "0xDef1C0ded9bec7F1a1670819833240f027b25EfF"],
  });

  console.log({ allowance }, "<---allowance");

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

  const approvalRequired = allowance === 0n || allowance === undefined;

  const { chains, switchChain } = useSwitchChain();

  return (
    <main className="sm:max-w-lg mx-auto text-lg mt-10 sm:mt-40">
      <div>You are connected to: {chain?.name}</div>
      {chains.map((chain) => (
        <button
          key={chain.id}
          onClick={() => switchChain({ chainId: chain.id })}
        >
          {chain.name}
        </button>
      ))}
      <section className="px-2">
        <h1 className="text-center text-4xl mt-6 mb-3">sol swap</h1>
        <Tabs selectedKey="bridge">
          <TabList aria-label="History of Ancient Rome">
            <Tab id="swap">Swap 🔁</Tab>
            <Tab id="bridge">Bridge 🌉</Tab>
          </TabList>
          <TabPanel id="swap">
            <Swap
              state={state}
              dispatch={dispatch}
              sellAmount={sellAmount}
              buyAmount={buyAmount}
              sellToken={sellToken}
              buyToken={buyToken}
              isSellingSol={isSellingSol}
              connected={connected}
              balance={balance}
              balanceUi={balanceUi}
              tokenBalance={tokenBalance}
              insufficientBalance={insufficientBalance}
              quote={quote}
              publicKey={publicKey}
              isFetchingQuote={isFetchingQuote}
              provider={provider}
              setVisible={setVisible}
            />
          </TabPanel>
          <TabPanel id="bridge">
            <Form>
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
                    value={sellAmount}
                    pattern="^[0-9]*[.,]?[0-9]*$"
                    className="pl-1 pr-8 pt-2 pb-3 rounded-lg border-0 w-full outline-none bg-transparent text-3xl"
                    onChange={(e) => {}}
                  />
                </label>
                <div className="flex items-end ml-3 flex-col justify-center">
                  <BottomSheetTokenSearch onSelect={(token: Token) => {}}>
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
                        onPress={() => {}}
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
                    value={buyAmount}
                    className="pl-1 pr-8 pt-2 pb-3 rounded-lg border-0 w-full outline-none bg-transparent text-3xl cursor-not-allowed"
                  />
                </label>
                <div className="flex items-end ml-3 flex-col justify-center">
                  <BottomSheetTokenSearch onSelect={(token) => {}}>
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
                  ⚠️ Insufficient balance: You don't have enough{" "}
                  {sellToken.symbol}.
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
                    onClick={async () => {}}
                  ></button>
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
          </TabPanel>
        </Tabs>
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

function Swap({
  state,
  dispatch,
  sellAmount,
  buyAmount,
  sellToken,
  buyToken,
  isSellingSol,
  connected,
  balance,
  balanceUi,
  tokenBalance,
  insufficientBalance,
  quote,
  publicKey,
  isFetchingQuote,
  provider,
  setVisible,
}: {
  state: any;
  dispatch: any;
  sellAmount: string;
  buyAmount: string;
  sellToken: Token;
  buyToken: Token;
  isSellingSol: boolean;
  connected: any;
  balance: any;
  balanceUi: any;
  tokenBalance: any;
  insufficientBalance: any;
  quote: any;
  publicKey: any;
  isFetchingQuote: any;
  provider: any;
  setVisible: any;
}) {
  return (
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
  );
}
