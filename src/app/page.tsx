"use client";
import { ApolloProvider } from "@apollo/client";
import client from "./services/apolloClient";
import Hello from "./components/Hello";
import MemoryEntryForm from "./components/MemoryEntryForm";
import MemoryTimelineContainer from "./components/MemoryTimelineContainer";

export default function Home() {
  return (
    <ApolloProvider client={client}>
      <div style={{ padding: 32 }}>
        <h1>Good Day App</h1>
        <Hello />
        <MemoryEntryForm onMemoryCreated={() => {}} />
        <MemoryTimelineContainer />
      </div>
    </ApolloProvider>
  );
}
