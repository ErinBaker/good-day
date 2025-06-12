import React from 'react';
import { Card, CardContent, Typography, CircularProgress } from '@mui/material';
import { ResponsiveRadialBar } from '@nivo/radial-bar';
import { usePersonTagStats } from '../useMemories';

const TaggedPersonsChart: React.FC = () => {
  const { personTagStats, loading, error } = usePersonTagStats(10);

  if (loading) return <Card sx={{ minWidth: 300, textAlign: 'center' }}><CardContent><CircularProgress /></CardContent></Card>;
  if (error) return <Card sx={{ minWidth: 300, textAlign: 'center' }}><CardContent><Typography color="error">Error loading person tag stats</Typography></CardContent></Card>;

  const personTagStatsSafe = Array.isArray(personTagStats)
    ? personTagStats.filter(
        (stat: { person: { id: string; name: string; relationship?: string }; tagCount: number }) =>
          stat &&
          stat.person &&
          typeof stat.person.name === 'string' &&
          typeof stat.tagCount === 'number'
      )
    : [];

  if (!personTagStatsSafe.length) {
    return (
      <Card sx={{ minWidth: 300, textAlign: 'center' }}>
        <CardContent>
          <Typography>No tag data available</Typography>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for Nivo RadialBar
  const data = personTagStatsSafe.map((stat) => ({
    id: stat.person.name,
    data: [
      {
        x: stat.person.name,
        y: stat.tagCount,
      },
    ],
  }));

  return (
    <Card sx={{ minWidth: 300, height: 350 }} aria-label="Most frequently tagged people">
      <CardContent>
        <Typography variant="h6" gutterBottom>Most Frequently Tagged People</Typography>
        <div style={{ height: 250 }}>
          <ResponsiveRadialBar
            data={data}
            valueFormat={v => `${v}`}
            startAngle={0}
            endAngle={360}
            padding={0.4}
            cornerRadius={2}
            radialAxisStart={null}
            circularAxisOuter={null}
            legends={[]}
            theme={{
              labels: { text: { fontSize: 12, fill: '#333' } },
              axis: { legend: { text: { fontSize: 14, fill: '#333' } } },
            }}
            ariaLabel="Tagged persons radial bar chart"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default TaggedPersonsChart; 