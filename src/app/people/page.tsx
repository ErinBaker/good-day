'use client';

import { useState } from 'react';
import { Box, Button, Alert, TextField, Typography, Skeleton } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import DateCell from '@/components/DateCell';
import Link from 'next/link';
import { useQuery, gql } from '@apollo/client';

const GET_ALL_PEOPLE = gql`
  query GetAllPeople($sortBy: String) {
    people(sortBy: $sortBy) {
      id
      name
      relationship
      createdAt
      updatedAt
    }
  }
`;

export default function PeoplePage() {
  const [search, setSearch] = useState('');
  const [sortBy] = useState('name');
  const { data, loading, error } = useQuery(GET_ALL_PEOPLE, {
    variables: { sortBy },
    fetchPolicy: 'network-only',
  });
  const people = data?.people || [];

  type Person = {
    id: string;
    name: string;
    relationship?: string | null;
    createdAt: string;
    updatedAt: string;
  };
  const filteredPeople = people
    .filter((p: Person) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.relationship || '').toLowerCase().includes(search.toLowerCase())
    );

  const columns = [
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 120 },
    { field: 'relationship', headerName: 'Relationship', flex: 1, minWidth: 120 },
    { field: 'createdAt', headerName: 'Created At', flex: 1, minWidth: 160, renderCell: (params: { value: string }) => <DateCell value={params.value} /> },
    { field: 'updatedAt', headerName: 'Updated At', flex: 1, minWidth: 160, renderCell: (params: { value: string }) => <DateCell value={params.value} /> },
  ];

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1" tabIndex={0} aria-label="People List">
          People List
        </Typography>
        <Button
          component={Link}
          href="/people/create"
          variant="contained"
          color="primary"
          sx={{ fontWeight: 600 }}
        >
          Create Person
        </Button>
      </Box>
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <TextField
          label="Search by name or relationship"
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
        />
      </Box>
      {loading ? (
        <Box>
          <Skeleton variant="rectangular" height={40} sx={{ mb: 1 }} />
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={32} sx={{ mb: 0.5 }} />
          ))}
        </Box>
      ) : error ? (
        <Alert severity="error">{error.message}</Alert>
      ) : (
        <DataGrid
          autoHeight
          rows={filteredPeople}
          columns={columns}
          initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          getRowId={(row: Person) => row.id}
        />
      )}
    </Box>
  );
} 