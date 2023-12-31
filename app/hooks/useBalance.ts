import { PublicKey } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { lamportsToTokenUnits } from "~/utils";
import type { Connection } from "@solana/web3.js";

const SOL_DECIMALS = 9;

export function useBalance({
  publicKey,
  connection,
  transactionReceipt,
}: {
  publicKey: PublicKey | null;
  connection: Connection;
  transactionReceipt: string;
}) {
  return useQuery({
    queryKey: [publicKey, `${transactionReceipt}-balance`],
    enabled: Boolean(publicKey),
    queryFn: async () => {
      if (publicKey) {
        const balance = await connection.getBalance(
          new PublicKey(publicKey.toString())
        );

        const uiAmount = lamportsToTokenUnits(balance, 9);

        return {
          uiAmount,
          uiAmountString: uiAmount.toString(),
          amount: balance.toString(),
          decimals: SOL_DECIMALS,
        };
      }
    },
  });
}
