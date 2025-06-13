"use client";
import React from "react";
import { useParams } from "next/navigation";
import { useQuery, gql, useMutation } from "@apollo/client";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import PersonPhotoMasonry from '../../components/PersonPhotoMasonry';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Button from '@mui/material/Button';
import { useState, useMemo } from 'react';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useRouter } from 'next/navigation';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import PersonStatistics from '../../components/PersonStatistics';
import { AvatarGenerator } from 'random-avatar-generator';

const PERSON_MEMORIES_QUERY = gql`
  query PersonMemories($id: ID!) {
    person(id: $id) {
      id
      name
      relationship
    }
    memories(peopleIds: [$id], limit: 100, sortBy: "date") {
      items {
        id
        photoUrl
        title
        date
      }
    }
  }
`;

const DELETE_PERSON_MUTATION = gql`
  mutation DeletePerson($id: ID!) {
    deletePerson(id: $id)
  }
`;

export default function PersonDetailPage() {
  const params = useParams();
  const id = params && typeof params.id !== 'undefined' ? (Array.isArray(params.id) ? params.id[0] : params.id) : '';
  const { data, loading, error } = useQuery(PERSON_MEMORIES_QUERY, { variables: { id }, fetchPolicy: 'network-only' });
  const person = data?.person;
  const memories = data?.memories?.items || [];
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const sortedMemories = useMemo(() => {
    return [...memories].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [memories, sortOrder]);
  const router = useRouter();
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePerson, { loading: deleting }] = useMutation(DELETE_PERSON_MUTATION, {
    variables: { id },
    onCompleted: () => {
      setDeleteDialogOpen(false);
      router.push('/people/list');
    },
    onError: () => {
      setDeleteDialogOpen(false);
      // TODO: Show error feedback
    },
  });
  const avatarGenerator = new AvatarGenerator();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    router.push(`/people/${id}/edit`);
  };

  const handleDelete = () => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    deletePerson();
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', py: 4, px: { xs: 1, sm: 2 } }}>
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Alert severity="error">Error loading person: {error.message}</Alert>
      )}
      {person && (
        <>
          {/* Header with back button, avatar, name, and relationship */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, position: 'relative' }}>
            <IconButton aria-label="Back" onClick={() => window.history.back()} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Avatar sx={{ width: 56, height: 56, fontSize: 28, bgcolor: 'primary.main', mr: 2 }}
              src={person.name ? avatarGenerator.generateRandomAvatar(person.name) : undefined}
              alt={person.name}
            >
              {/* fallback initials if no image loads */}
              {person.name ? person.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2) : '?'}
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1 }}>{person.name}</Typography>
              {person.relationship && (
                <Typography variant="subtitle1" color="text.secondary">{person.relationship}</Typography>
              )}
            </Box>
            {/* Context menu in upper right */}
            <IconButton
              aria-label="person actions"
              aria-controls={menuAnchorEl ? 'person-actions-menu' : undefined}
              aria-haspopup="true"
              onClick={handleMenuOpen}
              sx={{ position: 'absolute', top: 0, right: 0 }}
            >
              <MoreVertIcon />
            </IconButton>
            <Menu
              id="person-actions-menu"
              anchorEl={menuAnchorEl}
              open={Boolean(menuAnchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem onClick={handleEdit}>Edit</MenuItem>
              <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>Delete</MenuItem>
            </Menu>
          </Box>
          {/* Photo masonry grid with sorting toggle */}
          <Box sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                aria-label={`Sort by ${sortOrder === 'newest' ? 'oldest' : 'newest'} first`}
              >
                Sort: {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
              </Button>
            </Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              Memories with {person.name}:
            </Typography>
            <Box>
              {sortedMemories.length === 0 ? (
                <Typography color="text.secondary">No memories found for this person.</Typography>
              ) : (
                <PersonPhotoMasonry memories={sortedMemories} withTooltips />
              )}
            </Box>
            {/* Statistics Section */}
            <PersonStatistics memories={sortedMemories} />
          </Box>
          {/* Delete Confirmation Dialog */}
          <Dialog
            open={deleteDialogOpen}
            onClose={handleDeleteCancel}
            aria-labelledby="delete-person-dialog-title"
          >
            <DialogTitle id="delete-person-dialog-title">Delete Person</DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to say goodbye to <b>{person?.name}</b>?</Typography>
                <Typography>
                This can&apos;t be undone. Their profile will be gone, but the {memories.length} {memories.length === 1 ? 'memory' : 'memories'} they were part of will live on.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleDeleteCancel} color="primary" disabled={deleting}>Cancel</Button>
              <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Box>
  );
} 