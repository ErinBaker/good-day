import React, { useRef, useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { useMemories, Memory, useMemoryDateRange } from './useMemories';
import MemoryCard from './MemoryCard';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import { Stack, Button, Avatar, ToggleButton, ToggleButtonGroup, List, ListItem, ListItemAvatar, ListItemText, Checkbox, ListItemButton, useMediaQuery } from '@mui/material';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import Skeleton from '@mui/material/Skeleton';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import { useQuery, gql } from '@apollo/client';
import { useSearchParams } from 'next/navigation';
import SearchMemoriesInput, { type MemorySuggestion } from './SearchMemoriesInput';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import { AvatarGenerator } from 'random-avatar-generator';
import { useTheme } from '@mui/material/styles';
import MemoryTimelineFilters from './MemoryTimelineFilters';

const PAGE_SIZE = 5;

const GET_ALL_PEOPLE = gql`
  query GetAllPeople {
    people {
      id
      name
      relationship
    }
  }
`;

// Add Person type for people filter
type Person = {
  id: string;
  name: string;
  relationship?: string;
};

type ShortcutOption = { label: string; getValue: () => [Dayjs | null, Dayjs | null] };

const avatarGenerator = new AvatarGenerator();

const MemoryTimelineContainer: React.FC = () => {
  const [offset, setOffset] = useState(0);
  const [allMemories, setAllMemories] = useState<Memory[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const { minDate, maxDate } = useMemoryDateRange();
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [selectedPeople, setSelectedPeople] = useState<Person[]>([]);
  const { data: peopleData, loading: peopleLoading, error: peopleError } = useQuery<{ people: Person[] }>(GET_ALL_PEOPLE);
  const searchParams = useSearchParams();
  const [searchSelection, setSearchSelection] = useState<MemorySuggestion | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);

  const shortcutOptions: ShortcutOption[] = [
    {
      label: 'This Week',
      getValue: () => {
        const today = dayjs();
        return [today.startOf('week'), today.endOf('week')] as [Dayjs, Dayjs];
      },
    },
    {
      label: 'Last Week',
      getValue: () => {
        const today = dayjs();
        const prevWeek = today.subtract(7, 'day');
        return [prevWeek.startOf('week'), prevWeek.endOf('week')] as [Dayjs, Dayjs];
      },
    },
    {
      label: 'Last 7 Days',
      getValue: () => {
        const today = dayjs();
        return [today.subtract(7, 'day'), today] as [Dayjs, Dayjs];
      },
    },
    {
      label: 'Current Month',
      getValue: () => {
        const today = dayjs();
        return [today.startOf('month'), today.endOf('month')] as [Dayjs, Dayjs];
      },
    },
    {
      label: 'Reset',
      getValue: () => [minDate ? dayjs(minDate) : null, maxDate ? dayjs(maxDate) : null] as [Dayjs | null, Dayjs | null],
    },
  ];

  const [activeShortcut, setActiveShortcut] = useState<number | null>(null);

  // Handler for shortcut buttons
  const handleShortcut = (index: number) => {
    const shortcut = shortcutOptions[index];
    if (shortcut.label === 'Reset') {
      if (minDate && maxDate) {
        setDateRange([dayjs(minDate), dayjs(maxDate)]);
        setHasInitialized(true);
      } else {
        setDateRange([null, null]);
      }
      setActiveShortcut(null);
    } else {
      setDateRange(shortcut.getValue());
      setActiveShortcut(index);
    }
  };

  // Clear active shortcut if date is changed manually
  useEffect(() => {
    if (activeShortcut !== null) {
      const shortcut = shortcutOptions[activeShortcut];
      const [start, end] = shortcut.getValue();
      if (
        !(
          dateRange[0]?.isSame(start, 'day') &&
          dateRange[1]?.isSame(end, 'day')
        )
      ) {
        setActiveShortcut(null);
      }
    }
  }, [dateRange]);

  // Set initial dateRange from backend only if user hasn't changed them
  useEffect(() => {
    console.log('minDate:', minDate, 'maxDate:', maxDate, 'hasInitialized:', hasInitialized);
    if (!hasInitialized && minDate && maxDate) {
      setDateRange([dayjs(minDate), dayjs(maxDate)]);
      setHasInitialized(true);
    }
  }, [minDate, maxDate, hasInitialized]);

  useEffect(() => {
    console.log('dateRange:', dateRange);
  }, [dateRange]);

  // Reset memories and offset when date filter changes
  useEffect(() => {
    setAllMemories([]);
    setOffset(0);
    setHasMore(true);
    setInitialLoad(true);
  }, [dateRange[0], dateRange[1]]);

  // Only fetch if both dates are set
  const shouldFetch = dateRange[0] && dateRange[1];
  const { memories, totalCount, loading } = useMemories(
    shouldFetch
      ? {
          sortBy: 'date',
          limit: PAGE_SIZE,
          offset,
          dateFrom: dayjs(dateRange[0]).isValid() ? dayjs(dateRange[0]).toISOString() : undefined,
          dateTo: dayjs(dateRange[1]).isValid() ? dayjs(dateRange[1]).toISOString() : undefined,
          peopleIds: selectedPeople.length > 0 ? selectedPeople.map(p => p.id) : undefined,
          text: searchText || undefined,
        }
      : { sortBy: 'date', limit: 0, offset: 0 }
  );

  useEffect(() => {
    if (!shouldFetch) {
      setHasMore(false);
      return;
    }
    console.log('[InfiniteScroll] offset:', offset, 'memories.length:', memories.length, 'allMemories.length:', allMemories.length, 'hasMore:', hasMore);
    if (memories.length > 0) {
      setAllMemories((prev) => {
        // Avoid duplicates
        const ids = new Set(prev.map((m) => m.id));
        const newMemories = [...prev, ...memories.filter((m) => !ids.has(m.id))];
        console.log('[InfiniteScroll] Appending memories:', memories.map(m => m.id), 'Resulting allMemories:', newMemories.map(m => m.id));
        // Only set hasMore to false if we've loaded all items
        if (newMemories.length >= totalCount) setHasMore(false);
        return newMemories;
      });
    } else if (!loading && offset > 0) {
      // If no new memories are returned, stop infinite scroll
      setHasMore(false);
    }
    if (initialLoad && !loading) setInitialLoad(false);
  }, [memories, offset, loading, initialLoad, totalCount, shouldFetch]);

  // Intersection Observer for infinite scroll
  const loaderRef = useRef<HTMLDivElement>(null);
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore && !loading && !initialLoad) {
        setOffset((prev) => prev + PAGE_SIZE);
      }
    },
    [hasMore, loading, initialLoad]
  );

  useEffect(() => {
    const option = { root: null, rootMargin: '20px', threshold: 1.0 };
    const observer = new IntersectionObserver(handleObserver, option);
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [handleObserver]);

  // Set initial startDate and endDate to the earliest and latest memory dates
  useEffect(() => {
    const memoriesToCheck = allMemories.length > 0 ? allMemories : memories;
    if ((dateRange[0] === null || dateRange[1] === null) && memoriesToCheck.length > 0) {
      const sortedMemories = [...memoriesToCheck].sort((a, b) => Number(a.date) - Number(b.date));
      if (dateRange[0] === null) setDateRange([dayjs(Number(sortedMemories[0].date)), dateRange[1]]);
      if (dateRange[1] === null) setDateRange([dateRange[0], dayjs(Number(sortedMemories[sortedMemories.length - 1].date))]);
    }
  }, [
    allMemories.length,
    memories.length,
    dateRange[0] ? dateRange[0].valueOf() : null,
    dateRange[1] ? dateRange[1].valueOf() : null
  ]);

  // Pre-select people from URL query param on mount or when peopleData loads
  useEffect(() => {
    if (!peopleData?.people || !searchParams) return;
    const peopleParam = searchParams.get('people');
    if (peopleParam) {
      const ids = peopleParam.split(',');
      const selected = peopleData.people.filter(p => ids.includes(p.id));
      setSelectedPeople(selected);
    }
  }, [peopleData, searchParams]);

  // Always reset memories and offset on mount (or navigation to timeline)
  useEffect(() => {
    setAllMemories([]);
    setOffset(0);
    setHasMore(true);
    setInitialLoad(true);
  }, []);

  // When a suggestion is selected, update searchText and selectedMemoryId
  useEffect(() => {
    if (searchSelection) {
      setSearchText(searchSelection.title);
      setSelectedMemoryId(searchSelection.id);
    } else {
      setSearchText('');
      setSelectedMemoryId(null);
    }
  }, [searchSelection]);

  // Optionally clear search when filters change
  useEffect(() => {
    setSearchSelection(null);
    setSearchText('');
    setSelectedMemoryId(null);
  }, [dateRange[0], dateRange[1], selectedPeople]);

  // Ref map for scrolling
  const memoryRefs = useRef<{ [id: string]: HTMLDivElement | null }>({});
  useEffect(() => {
    if (selectedMemoryId && memoryRefs.current[selectedMemoryId]) {
      memoryRefs.current[selectedMemoryId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedMemoryId, allMemories]);

  const theme = useTheme();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('md'));

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>

      {/* Large search input above filters */}
      <Box sx={{ mb: 4, width: '100%' }}>
        <Box sx={{ width: '100%', fontSize: 20 }}>
          <SearchMemoriesInput
            value={searchSelection}
            onChange={setSearchSelection}
            label="Search Memories"
            placeholder="Type to search..."
          />
        </Box>
      </Box>

      {/* Main layout: sidebar (filters) + feed */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-start">
        {/* Sticky Sidebar Filters */}
        <MemoryTimelineFilters
          dateRange={dateRange}
          setDateRange={setDateRange}
          shortcutOptions={shortcutOptions}
          activeShortcut={activeShortcut}
          handleShortcut={handleShortcut}
          peopleData={peopleData}
          peopleLoading={peopleLoading}
          peopleError={peopleError}
          selectedPeople={selectedPeople}
          setSelectedPeople={setSelectedPeople}
          setAllMemories={setAllMemories}
          setOffset={setOffset}
          setHasMore={setHasMore}
          setInitialLoad={setInitialLoad}
        />

        {/* Memory Feed */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack spacing={3} alignItems="stretch">
            {/* Loading state */}
            {loading && (
              <>
                {[...Array(3)].map((_, i) => (
                  <Box key={i} sx={{ width: '100%', mx: 'auto', mb: 2 }}>
                    <Box
                      sx={{
                        bgcolor: 'background.paper',
                        borderRadius: 2,
                        boxShadow: 3,
                        p: { xs: 1, sm: 2 },
                        mb: 0,
                      }}
                    >
                      <Skeleton
                        variant="rectangular"
                        width="100%"
                        height={640}
                        sx={{ borderRadius: '8px 8px 0 0', bgcolor: 'grey.100' }}
                      />
                      <Box sx={{ p: { xs: 1, sm: 2 } }}>
                        <Skeleton variant="text" width="60%" height={32} sx={{ mb: 1 }} />
                        <Skeleton variant="text" width="90%" height={24} sx={{ mb: 1 }} />
                        <Skeleton variant="text" width="40%" height={20} />
                      </Box>
                    </Box>
                  </Box>
                ))}
              </>
            )}
            {/* Empty state */}
            {!loading && allMemories.length === 0 && (
              <Box textAlign="center" py={6}>
                <SentimentDissatisfiedIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                <Typography variant="h6" color="text.secondary" mt={2}>
                  No memories found for your filters.
                </Typography>
              </Box>
            )}
            {/* Memory cards */}
            {allMemories.map(memory => (
              <Box key={memory.id} sx={{ width: '100%' }}>
                <MemoryCard {...memory} />
              </Box>
            ))}
            {/* Infinite scroll loader */}
            <div ref={loaderRef}>
              {hasMore && !loading && <CircularProgress sx={{ my: 4 }} />}
              {!hasMore && !loading && allMemories.length > 0 && (
                <Box textAlign="center" py={6}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                  No more memories here — but there&apos;s always room for one more.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Want to add a new one?
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    href="/create-memory"
                    sx={{ mt: 1 }}
                  >
                    Create New Memory
                  </Button>
                </Box>
              )}
            </div>
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
};

export default MemoryTimelineContainer; 