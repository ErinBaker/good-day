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
  location?: { lat: number; lng: number };
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
        location {
          lat
          lng
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

export const MEMORY_STATISTICS_QUERY = gql`
  query MemoryStatistics {
    memoryStatistics {
      totalMemories
      totalPeople
    }
  }
`;

export const MEMORY_TIME_SERIES_QUERY = gql`
  query MemoryTimeSeries($interval: String) {
    memoryTimeSeries(interval: $interval) {
      date
      count
    }
  }
`;

export const PERSON_TAG_STATS_QUERY = gql`
  query PersonTagStats($limit: Int) {
    personTagStats(limit: $limit) {
      person {
        id
        name
        relationship
      }
      tagCount
    }
  }
`;

export const MEMORY_DATE_RANGE_STATS_QUERY = gql`
  query MemoryDateRangeStats {
    memoryDateRangeStats {
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

export function useMemoryStatistics() {
  const { data, loading, error } = useQuery<{ memoryStatistics: { totalMemories: number; totalPeople: number } }>(MEMORY_STATISTICS_QUERY);
  return {
    totalMemories: data?.memoryStatistics?.totalMemories ?? 0,
    totalPeople: data?.memoryStatistics?.totalPeople ?? 0,
    loading,
    error,
  };
}

export function useMemoryTimeSeries(interval: 'day' | 'week' | 'month' = 'month') {
  const { data, loading, error } = useQuery<{ memoryTimeSeries: { date: string; count: number }[] }>(MEMORY_TIME_SERIES_QUERY, {
    variables: { interval },
  });
  return {
    timeSeries: data?.memoryTimeSeries ?? [],
    loading,
    error,
  };
}

export function usePersonTagStats(limit: number = 10) {
  const { data, loading, error } = useQuery<{ personTagStats: { person: { id: string; name: string; relationship?: string }; tagCount: number }[] }>(PERSON_TAG_STATS_QUERY, {
    variables: { limit },
  });
  return {
    personTagStats: data?.personTagStats ?? [],
    loading,
    error,
  };
}

export function useMemoryDateRangeStats() {
  const { data, loading, error } = useQuery<{ memoryDateRangeStats: { minDate: string | null; maxDate: string | null } }>(MEMORY_DATE_RANGE_STATS_QUERY);
  return {
    minDate: data?.memoryDateRangeStats?.minDate ?? null,
    maxDate: data?.memoryDateRangeStats?.maxDate ?? null,
    loading,
    error,
  };
} 