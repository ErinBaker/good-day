'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  Alert,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import DateCell from '@/components/DateCell';

type Person = {
  id: string | number;
  name: string;
  relationship?: string | null;
  createdAt: string;
  updatedAt: string;
};

function EditPersonModal({ person, open, onClose, onSave }: { person: Person | null, open: boolean, onClose: () => void, onSave: (updated: Person) => void }) {
  const [name, setName] = useState(person?.name || '');
  const [relationship, setRelationship] = useState(person?.relationship || '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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
        onClose();
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

export default function PeopleListPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy] = useState('name');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editPerson, setEditPerson] = useState<Person | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ message: string, severity: 'success' | 'error' } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Person | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchPeople() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `query People($sortBy: String) { people(sortBy: $sortBy) { id name relationship createdAt updatedAt } }`,
            variables: { sortBy },
          }),
        });
        const json = await res.json();
        if (json.errors && json.errors.length > 0) {
          setError(json.errors[0].message);
        } else {
          setPeople(json.data.people || []);
        }
      } catch {
        setError('Failed to fetch people.');
      } finally {
        setLoading(false);
      }
    }
    fetchPeople();
  }, [sortBy]);

  const filteredPeople = people
    .filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.relationship || '').toLowerCase().includes(search.toLowerCase())
    );

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 120 },
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

  const handleEditClick = (person: Person) => {
    setEditPerson(person);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditPerson(null);
  };

  const handlePersonSave = (updated: Person) => {
    setPeople(prev => prev.map(p => p.id === updated.id ? updated : p));
    setSnackbar({ message: 'Person updated.', severity: 'success' });
  };

  const handleDeleteClick = (person: Person) => {
    setDeleteTarget(person);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
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
        setPeople(prev => prev.filter(p => p.id !== deleteTarget.id));
        setSnackbar({ message: 'Person deleted.', severity: 'success' });
      } else {
        setSnackbar({ message: 'Failed to delete person.', severity: 'error' });
      }
    } catch {
      setSnackbar({ message: 'An unexpected error occurred.', severity: 'error' });
    }
    setDeleteTarget(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>People List</Typography>
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <TextField
          label="Search by name or relationship"
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
        />
      </Box>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <DataGrid
          autoHeight
          rows={filteredPeople}
          columns={columns}
          initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          getRowId={row => row.id}
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
          <Typography>Are you sure you want to delete <b>{deleteTarget?.name}</b>? This cannot be undone.</Typography>
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