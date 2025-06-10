import gql from 'graphql-tag';

const typeDefs = gql`
  type Photo {
    id: String!
    originalFilename: String!
    folder: String!
    baseFilename: String!
    mimeType: String!
    size: Int!
    width: Int!
    height: Int!
    createdAt: String!
  }

  type Memory {
    id: Int!
    title: String!
    date: String!
    description: String!
    photoUrl: String
    createdAt: String!
    updatedAt: String!
    photos: [Photo!]!
  }

  type Query {
    hello: String
    memory(id: Int!): Memory
  }
  type Mutation {
    deleteMemory(id: Int!): Boolean!
  }
`;

export default typeDefs; 