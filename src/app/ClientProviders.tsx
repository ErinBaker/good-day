"use client";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { ApolloProvider } from '@apollo/client';
import client from './services/apolloClient.js';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <ApolloProvider client={client}>
        {children}
      </ApolloProvider>
    </LocalizationProvider>
  );
} 