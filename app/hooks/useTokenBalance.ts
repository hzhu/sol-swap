import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import type { Connection, PublicKey } from "@solana/web3.js";
import type { Token } from "~/types";

interface tokenAmount {
  amount: string;
  decimals: number;
  uiAmount: number;
  uiAmountString: string;
}

export function useTokenBalance({
  token,
  connection,
  publicKey,
  transactionReceipt,
}: {
  token: Token;
  connection: Connection;
  publicKey: PublicKey | null;
  transactionReceipt: string;
}) {
  const { data: tokenAccounts } = useQuery({
    queryKey: [publicKey, `${transactionReceipt}-tokenBalance`],
    queryFn: async () => {
      if (!publicKey) return Promise.resolve(null);
      return connection.getParsedTokenAccountsByOwner(publicKey, {
        programId: TOKEN_PROGRAM_ID,
      });
    },
  });

  const tokenBalance = useMemo(() => {
    if (tokenAccounts) {
      const [balance] = tokenAccounts.value.filter((v) => {
        return v.account.data.parsed.info.mint === token.address;
      });

      if (balance) {
        return balance.account.data.parsed.info.tokenAmount as tokenAmount;
      }
    }

    return undefined;
  }, [tokenAccounts, token]);

  return { tokenBalance };
}
