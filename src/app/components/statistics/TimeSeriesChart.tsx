import React from 'react';
import { Card, CardContent, Typography, CircularProgress } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { useMemoryTimeSeries } from '../useMemories';

const TimeSeriesChart: React.FC = () => {
  const { timeSeries, loading, error } = useMemoryTimeSeries('month');

  if (loading) return <Card sx={{ minWidth: 300, textAlign: 'center' }}><CardContent><CircularProgress /></CardContent></Card>;
  if (error) return <Card sx={{ minWidth: 300, textAlign: 'center' }}><CardContent><Typography color="error">Error loading time series</Typography></CardContent></Card>;

  const data = timeSeries.map((point: { date: string; count: number }) => ({
    x: new Date(point.date),
    y: point.count,
  }));

  return (
    <Card sx={{ minWidth: 300 }} aria-label="Memory creation frequency over time">
      <CardContent>
        <Typography variant="h6" gutterBottom>Memory Creation Frequency</Typography>
        <LineChart
          xAxis={[{ data: data.map(d => d.x), scaleType: 'time', label: 'Date' }]}
          series={[{ data: data.map(d => d.y), label: 'Memories' }]}
          height={250}
          margin={{ left: 40, right: 20, top: 20, bottom: 40 }}
          grid={{ vertical: true, horizontal: true }}
          aria-label="Memory creation frequency line chart"
        />
      </CardContent>
    </Card>
  );
};

export default TimeSeriesChart; 