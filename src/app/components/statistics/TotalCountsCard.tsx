import React from 'react';
import { Card, CardContent, Typography, Grid, CircularProgress } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import MemoryIcon from '@mui/icons-material/Memory';
import { useMemoryStatistics } from '../useMemories';

const TotalCountsCard: React.FC = () => {
  const { totalMemories, totalPeople, loading, error } = useMemoryStatistics();

  if (loading) return <Card sx={{ minWidth: 200, textAlign: 'center' }}><CardContent><CircularProgress /></CardContent></Card>;
  if (error) return <Card sx={{ minWidth: 200, textAlign: 'center' }}><CardContent><Typography color="error">Error loading stats</Typography></CardContent></Card>;

  return (
    <Card sx={{ minWidth: 200 }} aria-label="Total counts of memories and people">
      <CardContent>
        <Grid container spacing={2} alignItems="center" justifyContent="center">
          <Grid item xs={6} sx={{ textAlign: 'center' }}>
            <MemoryIcon color="primary" fontSize="large" aria-label="Memories" />
            <Typography variant="h5" component="div">{totalMemories}</Typography>
            <Typography variant="body2" color="text.secondary">Memories</Typography>
          </Grid>
          <Grid item xs={6} sx={{ textAlign: 'center' }}>
            <PeopleIcon color="secondary" fontSize="large" aria-label="People" />
            <Typography variant="h5" component="div">{totalPeople}</Typography>
            <Typography variant="body2" color="text.secondary">People</Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default TotalCountsCard; 