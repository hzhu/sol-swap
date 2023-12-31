import { useRef, useEffect } from "react";
import { getProvider } from "~/utils";
import type { PhantomWallet } from "~/types";

export function useProvider() {
  const providerRef = useRef<PhantomWallet>();

  useEffect(() => {
    providerRef.current = getProvider();
  }, []);

  return providerRef.current;
}
