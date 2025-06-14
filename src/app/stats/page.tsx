"use client";

import React from 'react';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import { Typography, Container } from '@mui/material';
import TotalCountsCard from '../components/statistics/TotalCountsCard';
import TimeSeriesChart from '../components/statistics/TimeSeriesChart';
import TaggedPersonsChart from '../components/statistics/TaggedPersonsChart';
import PatternVisualization from '../components/statistics/PatternVisualization';
import TaggedPeopleChordChart from '../components/statistics/TaggedPeopleChordChart';

const StatisticsDashboardPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom tabIndex={0} aria-label="Statistics Dashboard">
        Memory Statistics & Insights
      </Typography>
      <Stack spacing={3}>
        <Box display="flex" flexDirection="column" gap={3}>
          <Box flex={1}><TotalCountsCard /></Box>
          <Box flex={1}><TaggedPeopleChordChart /></Box>
          <Box flex={1}><TimeSeriesChart /></Box>
          <Box flex={1}><TaggedPersonsChart /></Box>
          <Box flex={1}><PatternVisualization /></Box>

        </Box>       
      </Stack>
    </Container>
  );
};

export default StatisticsDashboardPage; 