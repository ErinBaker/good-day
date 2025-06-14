import React from 'react';
import { Card, CardContent, Typography, CircularProgress } from '@mui/material';
import { ResponsiveTreeMap } from '@nivo/treemap';
import { usePersonTagStats } from '../useMemories';
import nivoTheme from '../../../app/stats/nivoTheme';

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

  // Prepare data for Nivo Treemap
  const data = {
    name: 'Tagged People',
    children: personTagStatsSafe.map((stat) => ({
      name: stat.person.name,
      value: stat.tagCount,
    })),
  };

  return (
    <Card aria-label="Most frequently tagged people">
      <CardContent>
        <Typography variant="h6" gutterBottom>Most Frequently Tagged People</Typography>
        <div style={{ height: 500 }}>
          <ResponsiveTreeMap
            data={data}
            identity="name"
            value="value"
            label={(datum) => `${datum.data.name} (${datum.value})`}
            labelSkipSize={12}
            labelTextColor="#333"
            parentLabelTextColor="#888"
            borderColor="#fff"
            colors={{ scheme: 'nivo' }}
            theme={nivoTheme}
            ariaLabel="Tagged persons treemap chart"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default TaggedPersonsChart; 