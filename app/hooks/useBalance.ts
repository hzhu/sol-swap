import { useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { lamportsToTokenUnits } from "~/utils";
import { type Connection } from "@solana/web3.js";
import type { Balance } from "~/types";

export function useBalance({
  publicKey,
  connection,
}: {
  publicKey: PublicKey | null;
  connection: Connection;
}) {
  const [balance, setBalance] = useState<Balance>();

  useEffect(() => {
    async function run() {
      if (publicKey) {
        const balance = await connection.getBalance(
          new PublicKey(publicKey.toString())
        );

        const uiAmount = lamportsToTokenUnits(balance, 9);

        setBalance({
          uiAmount,
          uiAmountString: uiAmount.toString(),
          amount: balance.toString(),
          decimals: 9,
        });
      }
    }
    if (publicKey) run();
  }, [connection, publicKey, setBalance]);

  return balance;
}
