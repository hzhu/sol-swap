import { useEffect, useState } from "react";
import { cssBundleHref } from "@remix-run/css-bundle";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { UnsafeBurnerWalletAdapter } from "@solana/wallet-adapter-wallets";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import type { LinksFunction, MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "Solana | solswap" },
    {
      property: "og:title",
      content: "Solana | solswap",
    },
    {
      name: "description",
      content: "The best prices Solana with solswap DEX aggregator",
    },
  ];
};

// Default styles that can be overridden by your app
// require("@solana/wallet-adapter-react-ui/styles.css");

export const links: LinksFunction = () => [
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
];

const rpcs = [
  "https://crimson-wider-field.solana-mainnet.quiknode.pro/ae46bf182ab5e4d0d797cfcf1222a368a8cafb47/",
  "https://solana-mainnet.g.alchemy.com/v2/25BADfV1u8vd9ygnc_gIyNUFgV40EJz7",
];

export default function App() {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  const [{ wallets, endpoint }] = useState(() => {
    // You can also provide a custom RPC endpoint.
    const endpoint = rpcs[1];

    const wallets = [
      /**
       * Wallets that implement either of these standards will be available automatically.
       *
       *   - Solana Mobile Stack Mobile Wallet Adapter Protocol
       *     (https://github.com/solana-mobile/mobile-wallet-adapter)
       *   - Solana Wallet Standard
       *     (https://github.com/solana-labs/wallet-standard)
       *
       * If you wish to support a wallet that supports neither of those standards,
       * instantiate its legacy wallet adapter here. Common legacy adapters can be found
       * in the npm package `@solana/wallet-adapter-wallets`.
       */
      new UnsafeBurnerWalletAdapter(),
    ];

    return {
      endpoint,
      wallets,
    };
  });

  const [isMounted, setIsMounted] = useState(false);
  const queryClient = new QueryClient();
  useEffect(() => setIsMounted(true), []);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="text-base bg-purple-100">
        {wallets && endpoint ? (
          <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
              <WalletModalProvider>
                {isMounted && (
                  <div className="flex justify-end mt-1 mr-1">
                    <WalletMultiButton>Connect</WalletMultiButton>
                  </div>
                )}
                <QueryClientProvider client={queryClient}>
                  <Outlet />
                </QueryClientProvider>
              </WalletModalProvider>
            </WalletProvider>
          </ConnectionProvider>
        ) : null}
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
