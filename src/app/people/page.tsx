'use client';

import React from 'react';
import { useState } from 'react';
import { Box, Button, Alert, TextField, Typography, Skeleton, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, CircularProgress, Snackbar } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import DateCell from '@/components/DateCell';
import Link from 'next/link';
import { useQuery, gql } from '@apollo/client';
import { AvatarGenerator } from 'random-avatar-generator';
import Avatar from '@mui/material/Avatar';

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
  const { data, loading, error, refetch } = useQuery(GET_ALL_PEOPLE, {
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

  const [editPerson, setEditPerson] = useState<Person | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ message: string, severity: 'success' | 'error' } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Person | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const avatarGenerator = new AvatarGenerator();

  const columns: GridColDef<Person>[] = [
    {
      field: 'avatar',
      headerName: '',
      width: 60,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const avatarUrl = params.row.name ? avatarGenerator.generateRandomAvatar(params.row.name) : undefined;
        return (
          <Avatar
            src={avatarUrl}
            alt={params.row.name}
            sx={{ width: 36, height: 36 }}
          />
        );
      },
    },
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <Link
          href={`/people/${params.row.id}`}
          style={{
            color: '#1976d2',
            textDecoration: 'underline',
            cursor: 'pointer',
            fontWeight: 500,
          }}
          tabIndex={0}
          aria-label={`View details for ${params.row.name}`}
        >
          {params.row.name}
        </Link>
      ),
    },
    { field: 'relationship', headerName: 'Relationship', flex: 1, minWidth: 120 },
    { field: 'createdAt', headerName: 'Created At', flex: 1, minWidth: 160, renderCell: (params) => <DateCell value={params.value} /> },
    { field: 'updatedAt', headerName: 'Updated At', flex: 1, minWidth: 160, renderCell: (params) => <DateCell value={params.value} /> },
    {
      field: 'actions',
      headerName: 'Actions',
      minWidth: 120,
      sortable: false,
      renderCell: (params) => (
        <Box display="flex" gap={1}>
          <IconButton aria-label="edit" color="primary" onClick={() => handleEditClick(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton aria-label="delete" color="error" onClick={() => handleDeleteClick(params.row)}>
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  function handleEditClick(person: Person) {
    setEditPerson(person);
    setModalOpen(true);
  }
  function handleModalClose() {
    setModalOpen(false);
    setEditPerson(null);
  }
  async function handlePersonSave() {
    setSnackbar({ message: 'Person updated.', severity: 'success' });
    setModalOpen(false);
    setEditPerson(null);
    await refetch();
  }
  function handleDeleteClick(person: Person) {
    setDeleteTarget(person);
    setDeleteDialogOpen(true);
  }
  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleteDialogOpen(false);
    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `mutation DeletePerson($id: ID!) { deletePerson(id: $id) }`,
          variables: { id: deleteTarget.id },
        }),
      });
      const json = await res.json();
      if (json.errors && json.errors.length > 0) {
        setSnackbar({ message: json.errors[0].message, severity: 'error' });
      } else if (json.data.deletePerson) {
        setSnackbar({ message: 'Person deleted.', severity: 'success' });
        await refetch();
      } else {
        setSnackbar({ message: 'Failed to delete person.', severity: 'error' });
      }
    } catch {
      setSnackbar({ message: 'An unexpected error occurred.', severity: 'error' });
    }
    setDeleteTarget(null);
  }

  // Edit modal
  function EditPersonModal({ person, open, onClose, onSave }: { person: Person | null, open: boolean, onClose: () => void, onSave: (updated: Person) => void }) {
    const [name, setName] = useState(person?.name || '');
    const [relationship, setRelationship] = useState(person?.relationship || '');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Reset fields when modal opens
    React.useEffect(() => {
      setName(person?.name || '');
      setRelationship(person?.relationship || '');
      setError(null);
    }, [person, open]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      const trimmedName = name.trim();
      if (!trimmedName) {
        setError('Name is required.');
        return;
      }
      setLoading(true);
      try {
        const res = await fetch('/api/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `mutation UpdatePerson($id: ID!, $input: PersonInput!) { updatePerson(id: $id, input: $input) { id name relationship createdAt updatedAt } }`,
            variables: { id: person?.id, input: { name: trimmedName, relationship: relationship || null } },
          }),
        });
        const json = await res.json();
        if (json.errors && json.errors.length > 0) {
          setError(json.errors[0].message);
        } else {
          onSave(json.data.updatePerson);
        }
      } catch {
        setError('An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    return (
      <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Person</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              id="edit-name"
              label="Name *"
              type="text"
              fullWidth
              value={name}
              onChange={e => setName(e.target.value)}
              required
              error={!!error && !name.trim()}
              helperText={!!error && !name.trim() ? error : ''}
            />
            <TextField
              margin="dense"
              id="edit-relationship"
              label="Relationship"
              type="text"
              fullWidth
              value={relationship}
              onChange={e => setRelationship(e.target.value)}
            />
            {error && name.trim() && (
              <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading} startIcon={loading ? <CircularProgress size={18} /> : null}>
              Save
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    );
  }

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
      <EditPersonModal
        person={editPerson}
        open={modalOpen}
        onClose={handleModalClose}
        onSave={handlePersonSave}
      />
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Person</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to say goodbye to <b>{deleteTarget?.name}</b>?<br/>
            This can&apos;t be undone. Their profile will be gone, but the memories they were part of will live on.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={!!snackbar}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        message={snackbar ? snackbar.message : undefined}
      >
        {snackbar ? (
          <Alert onClose={() => setSnackbar(null)} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
} 