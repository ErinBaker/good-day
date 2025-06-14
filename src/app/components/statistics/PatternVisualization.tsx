import React from 'react';
import { Card, CardContent, Typography, CircularProgress } from '@mui/material';
import { ResponsiveCalendar } from '@nivo/calendar';
import { useMemories } from '../useMemories';
import nivoTheme from '../../stats/nivoTheme';

const PatternVisualization: React.FC = () => {
  const { memories, loading, error } = useMemories();

  if (loading) return <Card sx={{ minWidth: 300, textAlign: 'center' }}><CardContent><CircularProgress /></CardContent></Card>;
  if (error) return <Card sx={{ minWidth: 300, textAlign: 'center' }}><CardContent><Typography color="error">Error loading memory patterns</Typography></CardContent></Card>;

  // Only show the current year
  const now = new Date();
  const currentYear = now.getFullYear();
  const from = `${currentYear}-01-01`;
  const to = `${currentYear}-12-31`;

  // Prepare data for Nivo Calendar: [{ day: 'YYYY-MM-DD', value: number }]
  const memoryCountByDay: Record<string, number> = {};
  memories.forEach((m) => {
    const day = m.date ? m.date.slice(0, 10) : m.createdAt.slice(0, 10);
    const year = new Date(day).getFullYear();
    if (year === currentYear) {
      memoryCountByDay[day] = (memoryCountByDay[day] || 0) + 1;
    }
  });
  const data = Object.entries(memoryCountByDay).map(([day, value]) => ({ day, value }));

  if (!data.length) {
    return (
      <Card sx={{ minWidth: 300, textAlign: 'center' }}>
        <CardContent>
          <Typography>No memory pattern data available for {currentYear}</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ minWidth: 300, height: 350 }} aria-label={`Memory patterns calendar for ${currentYear}`}>
      <CardContent>
        <Typography variant="h6" gutterBottom>Memory Patterns ({currentYear})</Typography>
        <div style={{ height: 320 }}>
          <ResponsiveCalendar
            data={data}
            from={from}
            to={to}
            emptyColor="#eeeeee"
            colors={["#b3c6ff", "#6495ed", "#1976d2", "#003399"]}
            margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
            yearSpacing={40}
            monthBorderColor="#fff"
            dayBorderWidth={2}
            dayBorderColor="#fff"
            theme={nivoTheme}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default PatternVisualization; 