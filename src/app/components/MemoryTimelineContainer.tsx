import React, { useRef, useCallback, useEffect, useState } from 'react';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import moment from 'moment';
import { useMemories, Memory } from './useMemories';
import MemoryCard from './MemoryCard';
import RelativeTime from './RelativeTime';
import { DatePicker } from '@mui/x-date-pickers';
import Slider from '@mui/material/Slider';
import dayjs, { Dayjs } from 'dayjs';

const PAGE_SIZE = 20;

const MemoryTimelineContainer: React.FC = () => {
  const [offset, setOffset] = useState(0);
  const [allMemories, setAllMemories] = useState<Memory[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [sliderValue, setSliderValue] = useState<number>(0);

  // Reset memories and offset when date filter changes
  useEffect(() => {
    setAllMemories([]);
    setOffset(0);
    setHasMore(true);
    setInitialLoad(true);
  }, [startDate, endDate]);

  const { memories, loading, error } = useMemories({
    sortBy: 'date',
    limit: PAGE_SIZE,
    offset,
    dateFrom: startDate ? startDate.toISOString() : undefined,
    dateTo: endDate ? endDate.toISOString() : undefined,
  });

  // Append new memories to the list
  useEffect(() => {
    if (memories.length > 0) {
      setAllMemories((prev) => {
        // Avoid duplicates
        const ids = new Set(prev.map((m) => m.id));
        return [...prev, ...memories.filter((m) => !ids.has(m.id))];
      });
      if (memories.length < PAGE_SIZE) setHasMore(false);
    } else if (offset > 0) {
      setHasMore(false);
    }
    if (initialLoad && !loading) setInitialLoad(false);
  }, [memories, offset, loading, initialLoad]);

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
    if ((startDate === null || endDate === null) && memoriesToCheck.length > 0) {
      const sortedMemories = [...memoriesToCheck].sort((a, b) => Number(a.date) - Number(b.date));
      if (startDate === null) setStartDate(dayjs(Number(sortedMemories[0].date)));
      if (endDate === null) setEndDate(dayjs(Number(sortedMemories[sortedMemories.length - 1].date)));
    }
  }, [allMemories, memories, startDate, endDate]);

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
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center' }}>
        <DatePicker
          label="Start Date"
          value={startDate}
          onChange={setStartDate}
          slotProps={{ textField: { size: 'small' } }}
        />
        <DatePicker
          label="End Date"
          value={endDate}
          onChange={setEndDate}
          slotProps={{ textField: { size: 'small' } }}
        />
      </Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'flex-start' }}>
        {/* Vertical Slider */}
        <Box sx={{ minHeight: 400, height: '100%', mr: { sm: 3, xs: 0 }, mb: { xs: 2, sm: 0 }, display: 'flex', alignItems: 'center' }}>
          <Slider
            orientation="vertical"
            min={0}
            max={allMemories.length > 0 ? allMemories.length - 1 : 0}
            value={sliderValue}
            onChange={(_, v) => setSliderValue(Number(v))}
            sx={{ height: 400 }}
            aria-label="Timeline Scrubber"
            disabled={allMemories.length === 0}
          />
        </Box>
        {/* Timeline and infinite scroll logic remain unchanged */}
        <Box sx={{ flex: 1 }}>
          {initialLoad && loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Error loading memories: {error.message}
            </Alert>
          )}
          <Timeline position="alternate" sx={{ p: 0 }}>
            {allMemories.length > 0 ? (
              allMemories.map((memory, idx) => {
                // Convert stringified timestamp to number if needed
                let dateValue: string | number = memory.date;
                if (typeof memory.date === 'string' && !isNaN(Number(memory.date))) {
                  dateValue = Number(memory.date);
                }
                const dateObj = moment(dateValue);
                const isValid = dateObj.isValid();
                const fullDate = isValid ? dateObj.format('YYYY-MM-DD HH:mm:ss') : memory.date;
                return (
                  <TimelineItem key={memory.id}>
                    <TimelineOppositeContent
                      sx={{
                        flex: 0.3,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: { xs: 'flex-start', sm: idx % 2 === 0 ? 'flex-end' : 'flex-start' },
                        justifyContent: 'center',
                        minWidth: 120,
                        pr: { sm: idx % 2 === 0 ? 2 : 0 },
                        pl: { sm: idx % 2 === 1 ? 2 : 0 },
                        py: 2,
                        color: 'text.secondary',
                      }}
                    >
                      <Tooltip title={fullDate} arrow>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, cursor: 'pointer' }}>
                          <RelativeTime date={memory.date} />
                        </Typography>
                      </Tooltip>
                      <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                        {memory.title}
                      </Typography>
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      <TimelineDot color="primary" />
                      {idx < allMemories.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    <TimelineContent sx={{ py: 2 }}>
                      <MemoryCard
                        id={memory.id}
                        photoUrl={memory.photoUrl}
                        people={memory.people}
                        description={memory.description}
                      />
                    </TimelineContent>
                  </TimelineItem>
                );
              })
            ) : !initialLoad && !loading && !error ? (
              <TimelineItem>
                <TimelineOppositeContent sx={{ color: 'text.secondary' }}>
                  &nbsp;
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineDot color="grey" />
                  <TimelineConnector />
                </TimelineSeparator>
                <TimelineContent>
                  <Typography variant="body2" color="text.secondary">
                    No memories to display yet.
                  </Typography>
                </TimelineContent>
              </TimelineItem>
            ) : null}
          </Timeline>
          <div ref={loaderRef} />
          {loading && !initialLoad && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <CircularProgress />
            </Box>
          )}
          {!hasMore && !loading && allMemories.length > 0 && (
            <Typography align="center" color="text.secondary" sx={{ my: 2 }}>
              No more memories to load.
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default MemoryTimelineContainer; 