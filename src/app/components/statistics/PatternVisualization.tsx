import React from 'react';
import { Card, CardContent, Typography, CircularProgress } from '@mui/material';
import { ResponsiveCalendar } from '@nivo/calendar';
import { useMemories } from '../useMemories';

const PatternVisualization: React.FC = () => {
  const { memories, loading, error } = useMemories();

  if (loading) return <Card sx={{ minWidth: 300, textAlign: 'center' }}><CardContent><CircularProgress /></CardContent></Card>;
  if (error) return <Card sx={{ minWidth: 300, textAlign: 'center' }}><CardContent><Typography color="error">Error loading memory patterns</Typography></CardContent></Card>;

  // Prepare data for Nivo Calendar: [{ day: 'YYYY-MM-DD', value: number }]
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 11, 1); // 12 months ago
  const end = now;

  // Count memories per day
  const memoryCountByDay: Record<string, number> = {};
  memories.forEach((m) => {
    const day = m.date ? m.date.slice(0, 10) : m.createdAt.slice(0, 10);
    memoryCountByDay[day] = (memoryCountByDay[day] || 0) + 1;
  });
  const data = Object.entries(memoryCountByDay).map(([day, value]) => ({ day, value }));

  if (!data.length) {
    return (
      <Card sx={{ minWidth: 300, textAlign: 'center' }}>
        <CardContent>
          <Typography>No memory pattern data available</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ minWidth: 300, height: 350 }} aria-label="Memory patterns calendar">
      <CardContent>
        <Typography variant="h6" gutterBottom>Memory Patterns (Last 12 Months)</Typography>
        <div style={{ height: 250 }}>
          <ResponsiveCalendar
            data={data}
            from={start.toISOString().slice(0, 10)}
            to={end.toISOString().slice(0, 10)}
            emptyColor="#eeeeee"
            colors={["#b3c6ff", "#6495ed", "#1976d2", "#003399"]}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            yearSpacing={40}
            monthBorderColor="#fff"
            dayBorderWidth={2}
            dayBorderColor="#fff"
            legends={[]}
            ariaLabel="Memory patterns calendar chart"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default PatternVisualization; 