import React from 'react';
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
import { useMemories } from './useMemories';
import MemoryCard from './MemoryCard';
import RelativeTime from './RelativeTime';

const MemoryTimelineContainer: React.FC = () => {
  const { memories, loading, error } = useMemories({ sortBy: 'date', limit: 20 });

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
      {loading && (
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
        {memories.length > 0 ? (
          memories.map((memory, idx) => {
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
                  {idx < memories.length - 1 && <TimelineConnector />}
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
        ) : !loading && !error ? (
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
    </Box>
  );
};

export default MemoryTimelineContainer; 