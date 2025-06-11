"use client";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CacheProvider } from '@emotion/react';
import createEmotionCache from './emotionCache';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { ApolloProvider } from '@apollo/client';
import client from './services/apolloClient.js';

const clientSideEmotionCache = createEmotionCache();

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#9c27b0' },
  },
});

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <CacheProvider value={clientSideEmotionCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <ApolloProvider client={client}>
            {children}
          </ApolloProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </CacheProvider>
  );
} 