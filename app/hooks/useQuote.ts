import { useEffect, type Dispatch } from "react";
import { useQuery } from "@tanstack/react-query";
import { lamportsToTokenUnits } from "~/utils";
import type { QuoteResponse } from "~/types";
import { type ActionTypes, type ReducerState } from "~/reducer";

export function useQuote({
  state,
  dispatch,
  debouncedSellAmount,
}: {
  state: ReducerState;
  dispatch: Dispatch<ActionTypes>;
  debouncedSellAmount: string;
}) {
  const query = useQuery<QuoteResponse>({
    queryKey: [
      state.buyToken,
      state.sellToken,
      state.sellAmount,
      debouncedSellAmount,
    ],
    enabled:
      Boolean(Number(debouncedSellAmount)) &&
      Boolean(Number(state.sellAmount)) &&
      state.sellAmount === debouncedSellAmount,
    queryFn: async () => {
      const { decimals } = state.sellToken;
      const amount = Math.round(
        parseFloat(debouncedSellAmount) * Math.pow(10, decimals)
      );
      const searchParams = new URLSearchParams({
        slippageBps: "25",
        onlyDirectRoutes: "false",
        asLegacyTransaction: "false",
        inputMint: state.sellToken.address,
        outputMint: state.buyToken.address,
        amount: amount.toString(),
      }).toString();
      const response = await fetch(`/quote?${searchParams}`);
      return response.json();
    },
  });

  // This is okay! See docs:
  // https://tanstack.com/query/latest/docs/react/guides/migrating-to-react-query-4#onsuccess-is-no-longer-called-from-setquerydata
  useEffect(() => {
    if (query.isFetching) return;
    const buyAmount = query.data
      ? lamportsToTokenUnits(
          Number(query.data.outAmount),
          state.buyToken.decimals
        ).toString()
      : "";
    dispatch({ type: "set buy amount", payload: buyAmount });
  }, [query.data, state.buyToken, query.isFetching, dispatch]);

  return query;
}
