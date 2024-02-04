import { formatUnits } from "viem";
import Confetti from "react-confetti";
import { useQuery } from "@tanstack/react-query";
import { Modal, Button, Dialog } from "react-aria-components";
import { Spinner } from "~/components";
import type { Hex } from "viem";

function useOrderStatus({ orderId }: { orderId: Hex | undefined }) {
  return useQuery({
    queryKey: ["DLNOrderStatus", orderId],
    refetchInterval: 30000,
    enabled: Boolean(orderId),
    queryFn: async () => {
      if (orderId) {
        const response = await fetch(
          `https://stats-api.dln.trade/api/Orders/${orderId}`
        );
        const data = (await response.json()) as any;

        if (!response.ok) {
          throw new Error(data.message);
        }

        return data;
      }
    },
  });
}

export function BridgeStatusModal({
  isOpen,
  setIsOpen,
  orderId,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  orderId: Hex | undefined;
}) {
  const { data: orderStatusData, error } = useOrderStatus({ orderId });

  if (error) {
    console.error(error);
  }

  const txCompleted = orderStatusData
    ? orderStatusData.state === "ClaimedUnlock" ||
      orderStatusData.state === "Fulfilled" ||
      orderStatusData.state === "SentUnlock"
    : false;

  const giveAmount = orderStatusData
    ? formatUnits(
        BigInt(orderStatusData.giveOfferWithMetadata.amount.stringValue),
        orderStatusData.giveOfferWithMetadata.metadata.decimals
      )
    : undefined;

  const takeAmount = orderStatusData
    ? formatUnits(
        BigInt(orderStatusData.takeOfferWithMetadata.amount.stringValue),
        orderStatusData.takeOfferWithMetadata.metadata.decimals
      )
    : undefined;

  const createTxHash = orderStatusData
    ? orderStatusData.createdSrcEventMetadata.transactionHash.stringValue
    : undefined;

  const fulfillTxHash =
    orderStatusData && orderStatusData.fulfilledDstEventMetadata // "fulfilledDstEventMetadata" can be null...
      ? orderStatusData.fulfilledDstEventMetadata.transactionHash.stringValue
      : undefined;

  return (
    <Modal
      isDismissable
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      className="px-2 sm:px-0 min-w-[548px]"
    >
      <Dialog className="bg-white rounded-md p-8 outline-none">
        <Button
          onPress={() => setIsOpen(false)}
          className="inline-block float-right relative bottom-[18px] left-[12px]"
        >
          <svg
            style={{ width: "16px" }}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 384 512"
          >
            <path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" />
          </svg>
        </Button>
        {txCompleted && orderStatusData ? (
          <div>
            <Confetti />
            <div className="text-center">
              <div className="text-2xl sm:text-3xl mb-4">
                Bridge Transaction Complete
              </div>
              <div className="my-3">You have successfully bridged…</div>
              <section>
                <div className="text-base flex items-center justify-center">
                  <img
                    alt={""}
                    src={orderStatusData?.giveOfferWithMetadata.logoURI}
                    className="w-7 h-7 mr-1 p-0 rounded-full"
                  />
                  <span>
                    <span className="font-semibold">
                      {giveAmount}{" "}
                      {orderStatusData?.giveOfferWithMetadata.symbol}
                    </span>{" "}
                    on Polygon
                  </span>
                  <a
                    href={`https://polygonscan.com/tx/${createTxHash}`}
                    className="ml-1 text-xs underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    (details)
                  </a>
                </div>
                <div className="text-sm my-1">to</div>
                <div className="text-base flex items-center justify-center">
                  <img
                    alt={""}
                    src={orderStatusData.takeOfferWithMetadata.logoURI}
                    className="w-7 h-7 mr-1 p-0 rounded-full"
                  />
                  <span>
                    <span className="font-semibold">
                      {takeAmount}{" "}
                      {orderStatusData.takeOfferWithMetadata.symbol}
                    </span>{" "}
                    on Solana
                  </span>
                  <a
                    href={`https://explorer.solana.com/tx/${fulfillTxHash}`}
                    className="ml-1 text-xs underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    (details)
                  </a>
                </div>
              </section>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex justify-center">
              <Spinner size={6} />
            </div>
            <div className="text-center">
              <div className="mt-8 text-lg">Bridge transaction pending…</div>
              <div className="my-2 text-sm">
                Your transaction has been sent to the blockchain.
              </div>
              {/* "The transaction may be completed in as little as 3 minutes, but it can take up to 30 minutes in some cases." */}
              {/* {error && <div className="text-red-500">{error.message}</div>} */}
            </div>
          </div>
        )}
      </Dialog>
    </Modal>
  );
}
