import React from 'react';
import { Card, CardContent, Typography, CircularProgress, Box } from '@mui/material';
import { useMemoryDateRangeStats } from '../useMemories';

const DateCoverageChart: React.FC = () => {
  const { minDate, maxDate, loading, error } = useMemoryDateRangeStats();

  if (loading) return <Card sx={{ minWidth: 300, textAlign: 'center' }}><CardContent><CircularProgress /></CardContent></Card>;
  if (error) return <Card sx={{ minWidth: 300, textAlign: 'center' }}><CardContent><Typography color="error">Error loading date range</Typography></CardContent></Card>;

  if (!minDate || !maxDate) return <Card sx={{ minWidth: 300, textAlign: 'center' }}><CardContent><Typography>No date range data</Typography></CardContent></Card>;

  // Defensive: parse dates to Date objects if needed in future charts
  // const min = new Date(minDate);
  // const max = new Date(maxDate);

  // For MVP, just show the range as text and a simple bar
  return (
    <Card sx={{ minWidth: 300 }} aria-label="Memory date range coverage">
      <CardContent>
        <Typography variant="h6" gutterBottom>Date Range Coverage</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {minDate} — {maxDate}
        </Typography>
        <Box sx={{ width: '100%', height: 16, background: '#eee', borderRadius: 8, position: 'relative' }}>
          <Box sx={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '100%', background: 'linear-gradient(90deg, #1976d2 0%, #64b5f6 100%)', borderRadius: 8 }} aria-label={`Date range from ${minDate} to ${maxDate}`}/>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DateCoverageChart; 