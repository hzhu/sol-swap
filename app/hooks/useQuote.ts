import { useEffect, type Dispatch } from "react";
import type { ActionTypes, ReducerState } from "~/reducer";

export function useQuote({
  state,
  dispatch,
  debouncedSellAmount,
}: {
  state: ReducerState;
  dispatch: Dispatch<ActionTypes>;
  debouncedSellAmount: string;
}) {
  useEffect(() => {
    if (!debouncedSellAmount) return;
    if (Number(debouncedSellAmount) === 0) return;
    if (!state.buyToken || !state.sellToken) return;
    if (debouncedSellAmount.toString() === "") return;
    if (state.sellAmount !== debouncedSellAmount) return;

    const amountInSmallestUnit =
      Number(debouncedSellAmount) * Math.pow(10, state.sellToken.decimals);

    if (amountInSmallestUnit.toString().includes(".")) return;

    const searchParams = new URLSearchParams({
      slippageBps: "25",
      onlyDirectRoutes: "false",
      asLegacyTransaction: "false",
      inputMint: state.sellToken.address,
      outputMint: state.buyToken.address,
      amount: amountInSmallestUnit.toString(),
    }).toString();

    async function fetchQuote() {
      dispatch({ type: "fetching quote", payload: true });
      const response = await fetch(`/quote?${searchParams}`);
      const data = await response.json();
      dispatch({ type: "set quote response", payload: data });
      dispatch({ type: "fetching quote", payload: false });
    }

    fetchQuote();
  }, [
    dispatch,
    debouncedSellAmount,
    state.sellAmount,
    state.buyToken,
    state.sellToken,
  ]);
}
