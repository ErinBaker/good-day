const { gql } = require('apollo-server-express');

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
    people: [Person!]!
  }

  type Person {
    id: Int!
    name: String!
    relationship: String!
    createdAt: String!
    updatedAt: String!
    memories: [Memory!]!
  }

  input MemoryInput {
    title: String!
    date: String!
    description: String!
    photoUrl: String
    peopleIds: [Int!]!
  }

  input PersonInput {
    name: String!
    relationship: String!
  }

  type Query {
    hello: String
    memories(limit: Int, offset: Int, sortBy: String): [Memory!]!
    memory(id: Int!): Memory
    people(limit: Int, offset: Int, sortBy: String): [Person!]!
    person(id: Int!): Person
  }
  type Mutation {
    createMemory(input: MemoryInput!): Memory!
    updateMemory(id: Int!, input: MemoryInput!): Memory!
    deleteMemory(id: Int!): Boolean!
    createPerson(input: PersonInput!): Person!
    updatePerson(id: Int!, input: PersonInput!): Person!
    deletePerson(id: Int!): Boolean!
    tagPersonInMemory(memoryId: Int!, personId: Int!): Memory!
    removePersonFromMemory(memoryId: Int!, personId: Int!): Memory!
  }
`;

module.exports = typeDefs; 