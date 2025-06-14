import React from 'react';
import { Card, CardContent, Typography, CircularProgress } from '@mui/material';
import { ResponsiveChord } from '@nivo/chord';
import { useMemories } from '../useMemories';
import nivoTheme from '../../../app/stats/nivoTheme';

const MAX_PEOPLE = 10; // Limit to top N people for clarity

const TaggedPeopleChordChart: React.FC = () => {
  const { memories, loading, error } = useMemories();

  if (loading) return <Card sx={{ minWidth: 300, textAlign: 'center' }}><CardContent><CircularProgress /></CardContent></Card>;
  if (error) return <Card sx={{ minWidth: 300, textAlign: 'center' }}><CardContent><Typography color="error">Error loading co-tag data</Typography></CardContent></Card>;

  // Count co-tag occurrences
  const personCounts: Record<string, number> = {};
  const coTagCounts: Record<string, Record<string, number>> = {};

  memories.forEach((memory) => {
    const people = (memory.people || []).map((p: { id: string; name: string; relationship?: string }) => p.name).filter(Boolean);
    people.forEach((p) => { personCounts[p] = (personCounts[p] || 0) + 1; });
    for (let i = 0; i < people.length; i++) {
      for (let j = 0; j < people.length; j++) {
        if (i !== j) {
          coTagCounts[people[i]] = coTagCounts[people[i]] || {};
          coTagCounts[people[i]][people[j]] = (coTagCounts[people[i]][people[j]] || 0) + 1;
        }
      }
    }
  });

  // Get top N people by tag count
  const topPeople = Object.entries(personCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_PEOPLE)
    .map(([name]) => name);

  // Build matrix for Nivo Chord
  const matrix = topPeople.map((p1) =>
    topPeople.map((p2) => (coTagCounts[p1]?.[p2] || 0))
  );

  // Defensive: ensure matrix is square and matches topPeople length
  const isValidMatrix =
    Array.isArray(matrix) &&
    matrix.length === topPeople.length &&
    matrix.length >= 2 &&
    matrix.every(row => Array.isArray(row) && row.length === topPeople.length);

  if (!isValidMatrix) {
    return (
      <Card sx={{ minWidth: 300, textAlign: 'center' }}>
        <CardContent>
          <Typography>Not enough co-tag data to display chord diagram</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card aria-label="Tagged people chord diagram">
      <CardContent>
        <Typography variant="h6" gutterBottom>Tagged People Relationships</Typography>
        <div style={{ height: 500 }}>
          <ResponsiveChord
            data={matrix}
            keys={topPeople}
            margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
            padAngle={0.04}
            innerRadiusRatio={0.96}
            innerRadiusOffset={0.02}
            arcOpacity={0.7}
            arcBorderWidth={1}
            arcBorderColor={{ from: 'color', modifiers: [['darker', 0.4]] }}
            ribbonOpacity={0.6}
            ribbonBorderWidth={1}
            ribbonBorderColor={{ from: 'color', modifiers: [['darker', 0.4]] }}
            labelRotation={-90}
            labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
            colors={{ scheme: 'category10' }}
            isInteractive={true}
            ariaLabel="Tagged people chord diagram"
            theme={nivoTheme}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default TaggedPeopleChordChart; 