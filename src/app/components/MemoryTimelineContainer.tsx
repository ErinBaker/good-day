import React, { useRef, useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { useMemories, Memory, useMemoryDateRange } from './useMemories';
import MemoryCard from './MemoryCard';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import { Stack, Button } from '@mui/material';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import SentimentVerySatisfiedIcon from '@mui/icons-material/SentimentVerySatisfied';
import Skeleton from '@mui/material/Skeleton';
import Fade from '@mui/material/Fade';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import { useQuery, gql } from '@apollo/client';
import { useSearchParams } from 'next/navigation';

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

const MemoryTimelineContainer: React.FC = () => {
  const [offset, setOffset] = useState(0);
  const [allMemories, setAllMemories] = useState<Memory[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const { minDate, maxDate } = useMemoryDateRange();
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [userChangedDate, setUserChangedDate] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [selectedPeople, setSelectedPeople] = useState<Person[]>([]);
  const { data: peopleData, loading: peopleLoading, error: peopleError } = useQuery<{ people: Person[] }>(GET_ALL_PEOPLE);
  const searchParams = useSearchParams();

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
      setUserChangedDate(false);
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
  const { memories, totalCount, loading, error } = useMemories(
    shouldFetch
      ? {
          sortBy: 'date',
          limit: PAGE_SIZE,
          offset,
          dateFrom: dayjs(dateRange[0]).isValid() ? dayjs(dateRange[0]).toISOString() : undefined,
          dateTo: dayjs(dateRange[1]).isValid() ? dayjs(dateRange[1]).toISOString() : undefined,
          peopleIds: selectedPeople.length > 0 ? selectedPeople.map(p => p.id) : undefined,
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
  const loaderRef = useRef<HTMLDivElement | null>(null);
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
        setUserChangedDate(false);
        setHasInitialized(true);
      } else {
        setDateRange([null, null]);
        setUserChangedDate(false);
      }
    } else {
      setDateRange(shortcut.getValue());
      setUserChangedDate(true);
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

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 800,
        mx: 'auto',
        py: 4,
        px: { xs: 1, sm: 2 },
      }}
      role="region"
      aria-label="Memory timeline"
    >
      {/* Date Range Filter */}
      <Box sx={{ mb: 3 }}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
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
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <DatePicker
              label="Start Date"
              value={dateRange[0] && dayjs.isDayjs(dateRange[0]) ? dateRange[0] : null}
              onChange={(newValue) => {
                setDateRange([newValue, dateRange[1]]);
                setUserChangedDate(true);
              }}
              slotProps={{ textField: { size: 'small' } }}
              maxDate={dateRange[1] || undefined}
            />
            <DatePicker
              label="End Date"
              value={dateRange[1] && dayjs.isDayjs(dateRange[1]) ? dateRange[1] : null}
              onChange={(newValue) => {
                setDateRange([dateRange[0], newValue]);
                setUserChangedDate(true);
              }}
              slotProps={{ textField: { size: 'small' } }}
              minDate={dateRange[0] || undefined}
            />
          </Stack>
        </LocalizationProvider>
      </Box>
      {/* People Filter */}
      <Box sx={{ mb: 3 }}>
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
            />
          )}
          renderTags={(selected, getTagProps) =>
            selected.map((option, index) => {
              const restTagProps = Object.fromEntries(Object.entries(getTagProps({ index })).filter(([k]) => k !== 'key'));
              return (
                <Chip
                  key={option.id}
                  label={option.name + (option.relationship ? ` (${option.relationship})` : '')}
                  {...restTagProps}
                />
              );
            })
          }
        />
      </Box>
      <Box sx={{ display: { xs: 'column', sm: 'row' }, flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'flex-start' }}>
        {/* Feed of MemoryCards */}
        <Box sx={{ flex: 1, minHeight: 400, height: '70vh' }}>
          {initialLoad && loading && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 4 }} aria-busy="true" aria-live="polite">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} variant="rectangular" width={600} height={180} sx={{ mb: 2, borderRadius: 2 }} />
              ))}
              <CircularProgress sx={{ mt: 2 }} aria-label="Loading memories" />
            </Box>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} role="alert">
              Error loading memories: {error.message}
            </Alert>
          )}
          <Stack spacing={3} sx={{ width: '100%', maxWidth: 600, mx: 'auto' }}>
            {(!loading && allMemories.length === 0 && !error) ? (
              <Fade in timeout={400} appear>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, width: '100%' }} role="status" aria-live="polite">
                  {userChangedDate || (dateRange[0] && dateRange[1]) ? (
                    <>
                      <SentimentDissatisfiedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} aria-hidden="true" />
                      <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                        No memories found for this time period.
                      </Typography>
                      <Button variant="outlined" onClick={() => {
                        setDateRange([minDate ? dayjs(minDate) : null, maxDate ? dayjs(maxDate) : null]);
                        setUserChangedDate(false);
                      }}>
                        Reset Filters
                      </Button>
                    </>
                  ) : (
                    <>
                      <SentimentVerySatisfiedIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} aria-hidden="true" />
                      <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                        You haven&apos;t added any memories yet.
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Start by adding your first memory!
                      </Typography>
                      <Button variant="contained" color="primary" href="#memory-entry-form">
                        Add Memory
                      </Button>
                    </>
                  )}
                </Box>
              </Fade>
            ) : allMemories.length > 0 ? (
              allMemories.map((memory) => (
                <MemoryCard
                  key={memory.id}
                  id={memory.id}
                  title={memory.title}
                  photoUrl={memory.photoUrl}
                  people={memory.people}
                  description={memory.description}
                  date={memory.date}
                  animate={true}
                />
              ))
            ) : null}
          </Stack>
          <div ref={loaderRef} />
          {loading && !initialLoad && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }} aria-busy="true" aria-live="polite">
              <CircularProgress aria-label="Loading more memories" />
            </Box>
          )}
          {!hasMore && !loading && allMemories.length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 2 }}>
              <Typography align="center" color="text.secondary" sx={{ mb: 2 }}>
                That&rsquo;s all for now — time to make another memory.
              </Typography>
              <Button variant="contained" color="primary" href="/create-memory">
                Create Memory
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default MemoryTimelineContainer; 