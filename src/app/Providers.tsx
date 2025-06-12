'use client';

import { CacheProvider } from '@emotion/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import createEmotionCache from './emotionCache';
import NavBar from './components/NavBar';
import ClientProviders from './ClientProviders';

const clientSideEmotionCache = createEmotionCache();
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#9c27b0' },
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CacheProvider value={clientSideEmotionCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <NavBar />
        <ClientProviders>
          {children}
        </ClientProviders>
      </ThemeProvider>
    </CacheProvider>
  );
} 