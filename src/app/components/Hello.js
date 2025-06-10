import React from 'react';
import { useQuery, gql } from '@apollo/client';

const HELLO_QUERY = gql`
  query Hello {
    hello
  }
`;

function Hello() {
  const { loading, error, data } = useQuery(HELLO_QUERY);
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  return <h2>{data.hello}</h2>;
}

export default Hello;
