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
import { Stack, Button, Avatar } from '@mui/material';
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

  // Move shortcutOptions here so minDate/maxDate are in scope
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
      label: 'Next Month',
      getValue: () => {
        const today = dayjs();
        const startOfNextMonth = today.endOf('month').add(1, 'day');
        return [startOfNextMonth, startOfNextMonth.endOf('month')] as [Dayjs, Dayjs];
      },
    },
    {
      label: 'Reset',
      getValue: () => [minDate ? dayjs(minDate) : null, maxDate ? dayjs(maxDate) : null] as [Dayjs | null, Dayjs | null],
    },
  ];

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

  type ShortcutOption = { label: string; getValue: () => [Dayjs | null, Dayjs | null] };
  // Handler for shortcut buttons
  const handleShortcut = (shortcut: ShortcutOption) => {
    if (shortcut.label === 'Reset') {
      if (minDate && maxDate) {
        setDateRange([dayjs(minDate), dayjs(maxDate)]);
        setHasInitialized(true);
      } else {
        setDateRange([null, null]);
      }
    } else {
      setDateRange(shortcut.getValue());
    }
  };

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
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems="flex-start">
        {/* Sticky Sidebar Filters */}
        <Box
          sx={{
            width: { xs: '100%', md: 320 },
            flexShrink: 0,
            position: { md: 'sticky' },
            top: { md: 32 },
            alignSelf: { md: 'flex-start' },
            zIndex: 1,
          }}
        >
          <Paper elevation={3} sx={{ p: 3, mb: { xs: 2, md: 0 } }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Filters
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                  {shortcutOptions.map((shortcut) => (
                    <Button
                      key={shortcut.label}
                      size="small"
                      variant="outlined"
                      onClick={() => handleShortcut(shortcut)}
                    >
                      {shortcut.label}
                    </Button>
                  ))}
                </Stack>
                <DatePicker
                  label="Start Date"
                  value={dateRange[0] && dayjs.isDayjs(dateRange[0]) ? dateRange[0] : null}
                  onChange={(newValue) => {
                    setDateRange([newValue, dateRange[1]]);
                  }}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  maxDate={dateRange[1] || undefined}
                />
                <DatePicker
                  label="End Date"
                  value={dateRange[1] && dayjs.isDayjs(dateRange[1]) ? dateRange[1] : null}
                  onChange={(newValue) => {
                    setDateRange([dateRange[0], newValue]);
                  }}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  minDate={dateRange[0] || undefined}
                />
                <Autocomplete
                  multiple
                  options={peopleData?.people || []}
                  value={selectedPeople}
                  onChange={(_e, newValue) => {
                    setSelectedPeople(newValue as Person[]);
                    setAllMemories([]); // Reset timeline when filter changes
                    setOffset(0);
                    setHasMore(true);
                    setInitialLoad(true);
                  }}
                  getOptionLabel={option => option.name + (option.relationship ? ` (${option.relationship})` : '')}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  loading={peopleLoading}
                  disabled={peopleLoading || !!peopleError}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label="Filter by People"
                      placeholder="Select people..."
                      error={!!peopleError}
                      helperText={peopleError ? 'Failed to load people' : ''}
                      fullWidth
                    />
                  )}
                  renderTags={(selected, getTagProps) =>
                    selected.map((option, index) => {
                      const restTagProps = Object.fromEntries(Object.entries(getTagProps({ index })).filter(([k]) => k !== 'key'));
                      const avatarUrl = 'name' in option ? avatarGenerator.generateRandomAvatar(option.name) : undefined;
                      return (
                        <Chip
                          key={option.id}
                          avatar={avatarUrl ? (
                            <Avatar src={avatarUrl} alt={`Avatar for ${option.name}`} sx={{ width: 32, height: 32 }} />
                          ) : undefined}
                          label={option.name + (option.relationship ? ` (${option.relationship})` : '')}
                          {...restTagProps}
                        />
                      );
                    })
                  }
                  renderOption={(props, option) => {
                    const avatarUrl = 'name' in option ? avatarGenerator.generateRandomAvatar(option.name) : undefined;
                    return (
                      <li {...props} key={option.id} style={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                          src={avatarUrl}
                          alt={`Avatar for ${option.name}`}
                          sx={{ width: 28, height: 28, marginRight: 1 }}
                        />
                        <span>{option.name}{option.relationship ? ` (${option.relationship})` : ''}</span>
                      </li>
                    );
                  }}
                />
              </Stack>
            </LocalizationProvider>
          </Paper>
        </Box>

        {/* Memory Feed */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack spacing={3} alignItems="stretch">
            {/* Loading state */}
            {loading && <Skeleton variant="rectangular" width="100%" height={200} />}
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
            </div>
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
};

export default MemoryTimelineContainer; 