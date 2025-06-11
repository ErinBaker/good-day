import { useQuery, gql } from '@apollo/client';

export interface Memory {
  id: string;
  title: string;
  date: string;
  description: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
  people: { id: string; name: string; relationship?: string }[];
  photos: { id: string; originalFilename: string; folder: string; baseFilename: string; mimeType: string; size: number; width: number; height: number; createdAt: string }[];
}

const MEMORIES_QUERY = gql`
  query Memories($limit: Int, $offset: Int, $sortBy: String, $dateFrom: String, $dateTo: String, $peopleIds: [ID!]) {
    memories(limit: $limit, offset: $offset, sortBy: $sortBy, dateFrom: $dateFrom, dateTo: $dateTo, peopleIds: $peopleIds) {
      id
      title
      date
      description
      photoUrl
      createdAt
      updatedAt
      people {
        id
        name
        relationship
      }
      photos {
        id
        originalFilename
        folder
        baseFilename
        mimeType
        size
        width
        height
        createdAt
      }
    }
  }
`;

interface UseMemoriesOptions {
  limit?: number;
  offset?: number;
  sortBy?: string;
  dateFrom?: string;
  dateTo?: string;
  peopleIds?: string[];
}

export function useMemories(options: UseMemoriesOptions = {}) {
  const { data, loading, error, refetch } = useQuery<{ memories: Memory[] }>(MEMORIES_QUERY, {
    variables: options,
  });

  return {
    memories: data?.memories ?? [],
    loading,
    error,
    refetch,
  };
} 