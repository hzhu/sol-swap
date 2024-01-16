import { erc20Abi, formatUnits } from "viem";
import { useReadContracts } from "wagmi";

import type { Address } from "viem";

const polygonUsdc = {
  address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
  decimals: 6,
  chainId: 137,
  logoURI:
    "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
  name: "USD Coin",
  symbol: "USDC",
};

export function useUsdcEvmBalance({
  fromEvmAddress,
}: {
  fromEvmAddress?: Address;
}) {
  const { data: erc20Balance, ...rest } = useReadContracts({
    contracts: [
      {
        // this needs to be dynamic depending on chain.
        // if connected to Ethereum, should use USDC on Ethereum
        address: polygonUsdc.address as Address,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [fromEvmAddress as Address],
      },
    ],
  });

  if (erc20Balance) {
    const [data] = erc20Balance;
    if (data.result) {
      const balance = {
        raw: data.result,
        formatted: formatUnits(data.result, polygonUsdc.decimals),
      };
      return { data: balance, ...rest };
    }
  }

  return { data: undefined, ...rest };
}
