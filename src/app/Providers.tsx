'use client';

import { CacheProvider } from '@emotion/react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import createEmotionCache from './emotionCache';
import ClientProviders from './ClientProviders';
import sunFadedRetroTheme from './sunFadedRetroTheme';

const clientSideEmotionCache = createEmotionCache();
const theme = sunFadedRetroTheme;

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CacheProvider value={clientSideEmotionCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ClientProviders>
          {children}
        </ClientProviders>
      </ThemeProvider>
    </CacheProvider>
  );
} 