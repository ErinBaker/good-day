"use client";

import React from 'react';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import { Typography, Container } from '@mui/material';
import TotalCountsCard from '../components/statistics/TotalCountsCard';
import TimeSeriesChart from '../components/statistics/TimeSeriesChart';
import TaggedPersonsChart from '../components/statistics/TaggedPersonsChart';
import DateCoverageChart from '../components/statistics/DateCoverageChart';
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
          <Box flex={1} minWidth={240}><TotalCountsCard /></Box>
          <Box flex={1} minWidth={320}><TimeSeriesChart /></Box>
          <Box flex={1} minWidth={240}><TaggedPersonsChart /></Box>
          <Box flex={1} minWidth={240}><DateCoverageChart /></Box>
          <Box flex={1} minWidth={240}><PatternVisualization /></Box>
          <Box flex={1} minWidth={240}><TaggedPeopleChordChart /></Box>
        </Box>       
      </Stack>
    </Container>
  );
};

export default StatisticsDashboardPage; 