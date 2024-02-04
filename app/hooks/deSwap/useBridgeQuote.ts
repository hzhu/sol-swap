import { useQuery } from "@tanstack/react-query";

const tokenAddresses = {
  SOL: "11111111111111111111111111111111", // native sol is not SPL, so this represents native sol?
};

// TODO: implement me.
// https://docs.dln.trade/dln-api/quick-start-guide/getting-a-quote
export function useBridgeQuote({
  fromAmount,
  enabled,
}: {
  fromAmount: string;
  enabled: boolean;
}) {
  return useQuery({
    queryKey: ["DLNQuote", fromAmount],
    refetchInterval: 30000,
    enabled: enabled && fromAmount !== "0",
    queryFn: async () => {
      if (fromAmount !== "0") {
        const response = await fetch(
          `https://api.dln.trade/v1.0/dln/order/quote?srcChainId=137&srcChainTokenIn=0x3c499c542cef5e3811e1192ce70d8cc03d5c3359&srcChainTokenInAmount=${fromAmount}&dstChainId=7565164&dstChainTokenOut=${tokenAddresses.SOL}&prependOperatingExpenses=true&affiliateFeePercent=0.1`
        );
        return response.json();
      }

      return Promise.resolve({ data: undefined, isLoading: true });
    },
  });
}
