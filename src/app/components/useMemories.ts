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
  query Memories($limit: Int, $offset: Int, $sortBy: String, $dateFrom: String, $dateTo: String, $peopleIds: [ID!], $text: String) {
    memories(limit: $limit, offset: $offset, sortBy: $sortBy, dateFrom: $dateFrom, dateTo: $dateTo, peopleIds: $peopleIds, text: $text) {
      items {
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
      totalCount
    }
  }
`;

export const MEMORY_DATE_RANGE_QUERY = gql`
  query MemoryDateRange {
    memoryDateRange {
      minDate
      maxDate
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
  text?: string;
}

export function useMemories(options: UseMemoriesOptions = {}) {
  const { data, loading, error, refetch } = useQuery<{ memories: { items: Memory[]; totalCount: number } }>(MEMORIES_QUERY, {
    variables: options,
  });

  return {
    memories: data?.memories?.items ?? [],
    totalCount: data?.memories?.totalCount ?? 0,
    loading,
    error,
    refetch,
  };
}

export function useMemoryDateRange() {
  const { data, loading, error } = useQuery<{ memoryDateRange: { minDate: string | null; maxDate: string | null } }>(MEMORY_DATE_RANGE_QUERY);
  return {
    minDate: data?.memoryDateRange?.minDate ?? null,
    maxDate: data?.memoryDateRange?.maxDate ?? null,
    loading,
    error,
  };
} 