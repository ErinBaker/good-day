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
    previousMemoryId: ID
    nextMemoryId: ID
    location: Location
  }

  type Person {
    id: ID!
    name: String!
    relationship: String
    createdAt: String!
    updatedAt: String!
    memories: [Memory!]!
  }

  type Location {
    lat: Float!
    lng: Float!
  }

  input MemoryInput {
    title: String!
    date: String!
    description: String!
    photoUrl: String
    peopleIds: [ID!]
    location: LocationInput
  }

  input MemoryUpdateInput {
    title: String
    date: String
    description: String
    photoUrl: String
    peopleIds: [ID!]
    location: LocationInput
  }

  input LocationInput {
    lat: Float!
    lng: Float!
  }

  input PersonInput {
    name: String!
    relationship: String
  }

  type MemoryDateRange {
    minDate: String
    maxDate: String
  }

  type MemoryConnection {
    items: [Memory!]!
    totalCount: Int!
  }

  type SearchHighlight {
    field: String!
    value: String!
    indices: [[Int!]!]!
  }

  type MemorySearchResult {
    memory: Memory!
    highlights: [SearchHighlight!]
  }

  type MemorySearchConnection {
    items: [MemorySearchResult!]!
    totalCount: Int!
  }

  type MemoryStats {
    totalMemories: Int!
    totalPeople: Int!
  }

  type TimeSeriesDataPoint {
    date: String!
    count: Int!
  }

  type PersonTagStats {
    person: Person!
    tagCount: Int!
  }

  type DateRangeStats {
    minDate: String
    maxDate: String
  }

  type Query {
    hello: String
    memory(id: ID!): Memory
    memories(limit: Int, offset: Int, sortBy: String, dateFrom: String, dateTo: String, peopleIds: [ID!], text: String): MemoryConnection
    person(id: ID!): Person
    people(search: String, limit: Int, offset: Int, sortBy: String): [Person]
    memoryDateRange: MemoryDateRange
    searchMemories(text: String, dateFrom: String, dateTo: String, peopleIds: [ID!], limit: Int, offset: Int): MemorySearchConnection
    memoryStatistics: MemoryStats!
    memoryTimeSeries(interval: String): [TimeSeriesDataPoint!]!
    personTagStats(limit: Int): [PersonTagStats!]!
    memoryDateRangeStats: DateRangeStats!
  }

  type Mutation {
    createMemory(input: MemoryInput!): Memory
    updateMemory(id: ID!, input: MemoryUpdateInput!): Memory
    deleteMemory(id: ID!): Boolean!
    createPerson(input: PersonInput!): Person
    updatePerson(id: ID!, input: PersonInput!): Person
    deletePerson(id: ID!): Boolean!
    tagPersonInMemory(memoryId: ID!, personId: ID!): Memory
    removePersonFromMemory(memoryId: ID!, personId: ID!): Memory
  }
`;

export default typeDefs; 