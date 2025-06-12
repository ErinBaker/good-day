import React, { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { BarChart, LineChart, ChartsGrid, ChartsTooltip, ChartsLegend } from '@mui/x-charts';
import { styled } from '@mui/material/styles';

interface Memory {
  id: string;
  date?: string;
}

interface PersonStatisticsProps {
  memories: Memory[];
}

interface ExpandMoreProps {
  expand?: boolean;
}

const ExpandMore = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== 'expand',
})<ExpandMoreProps>(({ theme, expand }) => ({
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}));

function getYear(dateStr: string) {
  return new Date(dateStr).getFullYear();
}

export default function PersonStatistics({ memories }: PersonStatisticsProps) {
  const [expanded, setExpanded] = useState(false);
  const handleExpandClick = () => setExpanded((prev) => !prev);

  // Calculate stats
  const { total, minDate, maxDate, freqByYear } = useMemo(() => {
    if (!memories || memories.length === 0) return { total: 0, minDate: null, maxDate: null, freqByYear: [] };
    const dates = memories.map(m => m.date).filter(Boolean) as string[];
    const sorted = [...dates].sort();
    const minDate = sorted[0];
    const maxDate = sorted[sorted.length - 1];
    const freq: Record<string, number> = {};
    dates.forEach(date => {
      const year = getYear(date);
      freq[year] = (freq[year] || 0) + 1;
    });
    const freqByYear = Object.entries(freq).map(([year, count]) => ({ year, count })).sort((a, b) => a.year.localeCompare(b.year));
    return { total: memories.length, minDate, maxDate, freqByYear };
  }, [memories]);

  return (
    <Card sx={{ my: 4 }}>
      <CardHeader
        title="Memory Statistics"
        action={
          <ExpandMore
            expand={expanded}
            onClick={handleExpandClick}
            aria-expanded={expanded}
            aria-label="Show memory statistics"
          >
            <ExpandMoreIcon />
          </ExpandMore>
        }
      />
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1">Total Memories: <strong>{total}</strong></Typography>
            {minDate && maxDate && (
              <Typography variant="subtitle2" color="text.secondary">
                Date Range: {new Date(minDate).toLocaleDateString()} – {new Date(maxDate).toLocaleDateString()}
              </Typography>
            )}
          </Box>
          {freqByYear.length > 0 && (
            <Box sx={{ width: '100%', height: 300, mb: 4 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Memories per Year (Bar Chart)</Typography>
              <BarChart
                height={300}
                series={[{ data: freqByYear.map(d => d.count), label: 'Memories', color: '#1976d2' }]}
                xAxis={[{ scaleType: 'band', data: freqByYear.map(d => d.year), label: 'Year' }]}
                yAxis={[{ label: 'Count', min: 0, max: Math.max(...freqByYear.map(d => d.count), 1) + 1 }]}
                grid={{ horizontal: true }}
              >
                <ChartsGrid />
                <ChartsTooltip />
                <ChartsLegend />
              </BarChart>
            </Box>
          )}
          {freqByYear.length > 0 && (
            <Box sx={{ width: '100%', height: 300 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Memories per Year (Line Chart)</Typography>
              <LineChart
                height={300}
                series={[{ data: freqByYear.map(d => d.count), label: 'Memories', color: '#1976d2' }]}
                xAxis={[{ scaleType: 'point', data: freqByYear.map(d => d.year), label: 'Year' }]}
                yAxis={[{ label: 'Count', min: 0, max: Math.max(...freqByYear.map(d => d.count), 1) + 1 }]}
                grid={{ horizontal: true }}
              >
                <ChartsGrid />
                <ChartsTooltip />
                <ChartsLegend />
              </LineChart>
            </Box>
          )}
        </CardContent>
      </Collapse>
    </Card>
  );
} 