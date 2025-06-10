import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { ApolloServer } from '@apollo/server';
import typeDefs from '../../src/graphql/typeDefs';
import resolvers from '../../src/graphql/resolvers';

const server = new ApolloServer({ typeDefs, resolvers });

export default startServerAndCreateNextHandler(server);
