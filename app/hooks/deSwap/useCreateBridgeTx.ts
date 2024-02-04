import { useQuery } from "@tanstack/react-query";
import type { useBridgeQuote } from "./useBridgeQuote";

const tokenAddresses = {
  SOL: "11111111111111111111111111111111", // native sol is not SPL, so this represents native sol?
};

const chainIds = { solana: 7565164 };

// https://docs.dln.trade/dln-api/quick-start-guide/requesting-order-creation-transaction
export function useCreateBridgeTx({
  recommendedSolAmount,
  fromAmount,
  bridgeQuote,
  toSvmAddress,
  fromEvmAddress,
  reviewSwap,
}: {
  recommendedSolAmount: number | string;
  fromAmount: string;
  bridgeQuote: ReturnType<typeof useBridgeQuote>;
  toSvmAddress: string | undefined;
  fromEvmAddress: string | undefined;
  reviewSwap: boolean;
}) {
  return useQuery({
    queryKey: ["DLN transaction", recommendedSolAmount, reviewSwap],
    refetchInterval: 60000,
    enabled: fromAmount !== "0",
    queryFn: async ({ queryKey }) => {
      const { 1: recommendedSolAmount, 2: reviewSwap } = queryKey;
      if (
        bridgeQuote &&
        fromAmount !== "0" &&
        recommendedSolAmount &&
        toSvmAddress &&
        fromEvmAddress &&
        reviewSwap
      ) {
        const recommendedAmount =
          bridgeQuote.data.estimation.dstChainTokenOut.recommendedAmount;
        const response = await fetch(
          `https://api.dln.trade/v1.0/dln/order/create-tx?srcChainId=137&srcChainTokenIn=0x3c499c542cef5e3811e1192ce70d8cc03d5c3359&srcChainTokenInAmount=${fromAmount}&dstChainId=${chainIds.solana}&dstChainTokenOut=${tokenAddresses.SOL}&dstChainTokenOutAmount=${recommendedAmount}&dstChainTokenOutRecipient=${toSvmAddress}&srcChainOrderAuthorityAddress=${fromEvmAddress}&dstChainOrderAuthorityAddress=${toSvmAddress}`
        );
        return response.json();
      }

      throw new Error("Data has not yet been fetched.");
    },
  });
}
