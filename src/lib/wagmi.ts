import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { arbitrumSepolia } from 'wagmi/chains';
import { cookieStorage, createStorage } from 'wagmi';

export const config = getDefaultConfig({
    appName: 'X Invest',
    projectId: 'YOUR_PROJECT_ID', // Replace with a valid WalletConnect project ID if needed, or use a placeholder for dev
    chains: [arbitrumSepolia],
    ssr: false,
});
