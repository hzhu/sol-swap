import { useRef, useEffect } from "react";
import { getProvider, getProviderEthereum } from "~/utils";
import type { PhantomWallet } from "~/types";

export function useProvider() {
  const providerRef = useRef<PhantomWallet>();

  useEffect(() => {
    providerRef.current = getProvider();
  }, []);

  return providerRef.current;
}

// TODO: refactor
export function useEthProvider() {
  const providerRef = useRef<PhantomWallet>();

  useEffect(() => {
    providerRef.current = getProviderEthereum();
  }, []);

  return providerRef.current;
}
