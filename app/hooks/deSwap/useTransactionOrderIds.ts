import { useQuery } from "@tanstack/react-query";

// https://stats-api.dln.trade/api/Transaction/0x3db3c24d8c9afd9d8282efd95964b15ee4a1c96cf4eaa44b8155f0efec6a15aa/orderIds
export function useTransactionOrderIds({
  txHash,
}: {
  txHash: `0x${string}` | undefined;
}) {
  return useQuery({
    queryKey: ["DLNOrderTransaction", txHash],
    enabled: Boolean(txHash),
    refetchInterval: 10000,
    queryFn: async () => {
      if (txHash) {
        const response = await fetch(
          `https://stats-api.dln.trade/api/Transaction/${txHash}/orderIds`
        );
        const { orderIds } = (await response.json()) as any;
        const [orderId] = orderIds;
        const { stringValue } = orderId;

        return stringValue;
      }

      return Promise.resolve(undefined);
    },
  });
}
