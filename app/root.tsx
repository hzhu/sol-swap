import { cssBundleHref } from "@remix-run/css-bundle";
import type { LinksFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import React, { FC, useEffect, useMemo, useState } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { UnsafeBurnerWalletAdapter } from "@solana/wallet-adapter-wallets";
import {
  WalletModalProvider,
  WalletDisconnectButton,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";

import styles from "./tailwind.css";

// Default styles that can be overridden by your app
require("@solana/wallet-adapter-react-ui/styles.css");

export const links: LinksFunction = () => [
  ...(cssBundleHref
    ? [
        { rel: "stylesheet", href: cssBundleHref },
        { rel: "stylesheet", href: styles },
      ]
    : []),
];

export default function App() {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  const [{ wallets, endpoint }] = useState(() => {
    const network = WalletAdapterNetwork.Mainnet;

    // You can also provide a custom RPC endpoint.
    const endpoint =
      "https://crimson-wider-field.solana-mainnet.quiknode.pro/ae46bf182ab5e4d0d797cfcf1222a368a8cafb47/";

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
  useEffect(() => setIsMounted(true), []);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {wallets && endpoint ? (
          <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
              <WalletModalProvider>
                {isMounted && (
                  <div style={{ display: "flex", justifyContent: "end" }}>
                    <WalletMultiButton />
                    &nbsp;&nbsp;
                    <WalletDisconnectButton />
                  </div>
                )}
                <Outlet />
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
