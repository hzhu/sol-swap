import { useEffect } from "react";
import { formatUnits } from "viem";
import { useAccount, useSendTransaction } from "wagmi";
import { Button, Dialog, Heading, Modal } from "react-aria-components";
import { Spinner } from "~/components";

function calculateRate(responseData: any) {
  // Assuming responseData is the object containing the response data
  const usdcAmount = parseInt(
    responseData.estimation.srcChainTokenIn.amount,
    10
  );
  const solAmount = parseInt(
    responseData.estimation.dstChainTokenOut.amount,
    10
  );

  // Convert to standard units
  const usdcStandard = usdcAmount / Math.pow(10, 6); // USDC has 6 decimal places
  const solStandard = solAmount / Math.pow(10, 9); // SOL has 9 decimal places

  // Calculate the rate
  const rateUsdcPerSol = usdcStandard / solStandard;

  return rateUsdcPerSol;
}

export function BridgeReviewModal({
  isOpen,
  setIsReviewOpen,
  createdTxData,
  onSubmitted,
  setIsStatusOpen,
}: any) {
  const rate = createdTxData ? calculateRate(createdTxData) : undefined;
  const estimation = createdTxData ? createdTxData.estimation : undefined;
  const { address: fromEvmAddress } = useAccount();

  const {
    sendTransactionAsync,
    data: bridgeTxData,
    status: bridgeTxStatus,
  } = useSendTransaction();

  // letz pass this into handler instead.
  // memoize onBridgeTxSent
  useEffect(() => {
    if (bridgeTxData) {
      onSubmitted(bridgeTxData);
    }
  }, [onSubmitted, bridgeTxData]);

  return (
    <Modal
      isDismissable
      isOpen={isOpen}
      onOpenChange={setIsReviewOpen}
      className="px-2 sm:px-0 min-w-[548px]"
    >
      <Dialog className="bg-white rounded-md p-8 outline-none">
        <Button
          onPress={() => setIsReviewOpen(false)}
          className="inline-block float-right relative bottom-[10px] left-[8px]"
        >
          <svg
            style={{ width: "16px" }}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 384 512"
          >
            <path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" />
          </svg>
        </Button>
        <Heading slot="title" className="text-2xl text-center">
          Review Transaction
        </Heading>
        <div className="my-8">
          <div className="text-slate-600">
            You send on <span className="font-semibold">Polygon</span>
          </div>
          {estimation ? (
            <div className="flex items-center justify-between">
              <span className="text-4xl">
                {formatUnits(
                  estimation.srcChainTokenIn.amount,
                  estimation.srcChainTokenIn.decimals
                )}
                &nbsp;
                {estimation.srcChainTokenIn.symbol}
              </span>
              &nbsp;
              <img
                width={50}
                height={50}
                alt=""
                src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png"
              />
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div role="status" className="animate-pulse">
                <div className="h-3 bg-gray-200 rounded-full w-96"></div>
              </div>
              &nbsp;
              <img
                width={50}
                height={50}
                alt=""
                src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png"
              />
            </div>
          )}
          <div className="text-slate-600 mt-3">
            You receive on <span className="font-semibold">Solana</span>
          </div>
          {estimation ? (
            <div className="flex items-center justify-between">
              <span className="text-4xl">0.34234 SOL</span>
              &nbsp;
              <img
                width={50}
                height={50}
                alt="Solana logo"
                className="rounded-full"
                src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png"
              />
            </div>
          ) : (
            // loading...
            <div className="flex items-center justify-between">
              <div role="status" className="animate-pulse">
                <div className="h-3 bg-gray-200 rounded-full w-96"></div>
              </div>
              &nbsp;
              <img
                width={50}
                height={50}
                alt="Solana logo"
                className="rounded-full"
                src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png"
              />
            </div>
          )}
        </div>
        <div>
          {estimation ? (
            <div className="text-sm">
              <div className="flex justify-between my-2">
                <div className="text-slate-700">Rate</div>
                {rate ? <div>{rate.toFixed(2)} USDC = 1 SOL</div> : null}
              </div>
              <div className="flex justify-between my-2">
                <div className="text-slate-700">Network fee</div>
                <div>0.5 MATIC (~$0.50)</div>
              </div>
              <div className="flex justify-between my-2">
                <div className="text-slate-700">Integrator fee</div>
                <div className="text-green-700 font-semibold">FREE</div>
              </div>
              <div className="flex justify-between my-2 flex-col sm:flex-row">
                <div className="text-slate-700">Recipient</div>
                <div className="text-black">
                  0x8a6BFCae15E729fd1440574108437dEa281A9B3e
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm">
              <div className="flex justify-between my-2">
                <div className="text-slate-700">Rate</div>
                <div role="status" className="animate-pulse w-1/2">
                  <div className="h-2 bg-gray-200 rounded-full w-full"></div>
                </div>
              </div>
              <div className="flex justify-between my-2">
                <div className="text-slate-700">Network fee</div>
                <div role="status" className="animate-pulse w-1/2">
                  <div className="h-2 bg-gray-200 rounded-full w-full"></div>
                </div>
              </div>
              <div className="flex justify-between my-2">
                <div className="text-slate-700">Integrator fee</div>
                <div role="status" className="animate-pulse w-1/2">
                  <div className="h-2 bg-gray-200 rounded-full w-full"></div>
                </div>
              </div>
              <div className="flex justify-between my-2">
                <div className="text-slate-700">Recipient</div>
                <div role="status" className="animate-pulse w-1/2">
                  <div className="h-2 bg-gray-200 rounded-full w-full"></div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end mt-8">
          <Button
            onPress={() => setIsReviewOpen(false)}
            className="mr-3 w-18 h-10 py-1 px-3 rounded-md border flex items-center justify-center transition-colors duration-250 border-none dark:hover:bg-blue-marguerite-900 dark:pressed:bg-blue-marguerite-700"
          >
            <span>Cancel</span>
          </Button>
          <Button
            className="text-white w-32 h-10 py-1 px-3 rounded-md border flex items-center justify-center outline-none outline-2 outline-dotted  focus-visible:outline-purple-300 transition-colors duration-250 bg-purple-800 hover:bg-purple-800/95 pressed:bg-purple-950 border-purple-950"
            onPress={() => {
              if (!createdTxData) return;
              const { data, to, value } = createdTxData.tx;
              sendTransactionAsync(
                {
                  to,
                  account: fromEvmAddress,
                  type: "eip1559",
                  chainId: 137,
                  data: data,
                  value: value,
                },
                {
                  onSuccess(data: any, variables: any, context: any) {
                    // open bridge status modal
                    setIsReviewOpen(false);
                    setIsStatusOpen(true);
                  },
                }
              );
            }}
          >
            {bridgeTxStatus === "pending" ? (
              <span className="flex items-center">
                <Spinner size={1.2} />
                <span className="ml-1">Bridging…</span>
              </span>
            ) : (
              "Bridge"
            )}
          </Button>
        </div>
      </Dialog>
    </Modal>
  );
}
