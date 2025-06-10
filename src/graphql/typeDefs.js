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
    id: ID!
    title: String!
    date: String!
    description: String!
    photoUrl: String
    createdAt: String!
    updatedAt: String!
    people: [Person!]!
    photos: [Photo!]!
  }

  type Person {
    id: ID!
    name: String!
    relationship: String
    createdAt: String!
    updatedAt: String!
    memories: [Memory!]!
  }

  input MemoryInput {
    title: String!
    date: String!
    description: String!
    photoUrl: String
    peopleIds: [ID!]
  }

  input PersonInput {
    name: String!
    relationship: String
  }

  type Query {
    hello: String
    memory(id: ID!): Memory
    memories(limit: Int, offset: Int, sortBy: String): [Memory]
    person(id: ID!): Person
    people(search: String, limit: Int, offset: Int, sortBy: String): [Person]
  }

  type Mutation {
    createMemory(input: MemoryInput!): Memory
    updateMemory(id: ID!, input: MemoryInput!): Memory
    deleteMemory(id: ID!): Boolean!
    createPerson(input: PersonInput!): Person
    updatePerson(id: ID!, input: PersonInput!): Person
    deletePerson(id: ID!): Boolean!
    tagPersonInMemory(memoryId: ID!, personId: ID!): Memory
    removePersonFromMemory(memoryId: ID!, personId: ID!): Memory
  }
`;

export default typeDefs; 