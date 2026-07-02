"use client";

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { baseSepolia, localhost } from 'wagmi/chains';
import { ConnectKitProvider, getDefaultConfig } from 'connectkit';

// Gunakan projectId WalletConnect dummy
const projectId = 'your_project_id_placeholder';

const config = createConfig(
  getDefaultConfig({
    appName: 'PawnPool',
    walletConnectProjectId: projectId,
    chains: [baseSepolia, localhost],
    transports: {
      [baseSepolia.id]: http(),
      [localhost.id]: http(),
    },
  })
);

const queryClient = new QueryClient();

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
export default AppShell;
