import React from 'react';
import { ApolloProvider } from '@apollo/client';
import client from './services/apolloClient';
import Hello from './components/Hello';
import MemoryEntryForm from './components/MemoryEntryForm';

function App() {
  return (
    <ApolloProvider client={client}>
      <div style={{ padding: 32 }}>
        <h1>Good Day App</h1>
        <Hello />
        <MemoryEntryForm />
      </div>
    </ApolloProvider>
  );
}

export default App;
