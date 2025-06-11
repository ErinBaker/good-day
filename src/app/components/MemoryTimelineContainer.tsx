import React from 'react';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface MemoryTimelineContainerProps {
  children?: React.ReactNode;
}

const MemoryTimelineContainer: React.FC<MemoryTimelineContainerProps> = ({ children }) => {
  const hasChildren = React.Children.count(children) > 0;

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 600,
        mx: 'auto',
        py: 4,
        px: { xs: 1, sm: 2 },
      }}
      role="region"
      aria-label="Memory timeline"
    >
      <Timeline position="right" sx={{ p: 0 }}>
        {/* TODO: Render memory cards as TimelineItems here in a future subtask */}
        {hasChildren ? (
          children
        ) : (
          <TimelineItem>
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
        )}
      </Timeline>
    </Box>
  );
};

export default MemoryTimelineContainer; 