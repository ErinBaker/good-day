"use client";
import React, { useState, useMemo } from "react";
import {
  Box, Card, CardHeader, Typography, CircularProgress,
  Avatar, IconButton, Button, Stack, Tooltip, ToggleButton, ToggleButtonGroup, Dialog, DialogTitle, DialogContent, DialogActions, Menu, MenuItem
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useParams, useRouter } from "next/navigation";
import { useQuery, gql, useMutation } from "@apollo/client";
import PersonPhotoMasonry from '../../components/PersonPhotoMasonry';
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
  const { data, loading } = useQuery(PERSON_MEMORIES_QUERY, { variables: { id }, fetchPolicy: 'network-only' });
  const person = data?.person;
  const memories = useMemo(() => data?.memories?.items || [], [data]);
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
    <Box sx={{ maxWidth: 900, mx: "auto", py: 4, px: { xs: 1, sm: 2 } }}>
      {/* Header Card */}
      <Card sx={{ mb: 4, p: 2 }}>
        <CardHeader
          avatar={
            <Tooltip title="Back">
              <IconButton aria-label="Back" onClick={() => router.back()}>
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
          }
          action={
            <Tooltip title="Actions">
              <IconButton aria-label="Person actions" onClick={handleMenuOpen}>
                <MoreVertIcon />
              </IconButton>
            </Tooltip>
          }
          title={
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar
                sx={{ width: 72, height: 72, fontSize: 32, bgcolor: "primary.main" }}
                src={person?.name ? avatarGenerator.generateRandomAvatar(person.name) : undefined}
                alt={person?.name}
              >
                {person?.name ? person.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2) : "?"}
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight={700}>{person?.name}</Typography>
                {person?.relationship && (
                  <Typography variant="subtitle1" color="text.secondary">{person.relationship}</Typography>
                )}
              </Box>
            </Stack>
          }
        />
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
      </Card>

      {/* Photo Masonry & Sorting */}
      <Card sx={{ mb: 4, p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Memories ({sortedMemories.length})</Typography>
          <ToggleButtonGroup
            value={sortOrder}
            exclusive
            onChange={(_, value) => value && setSortOrder(value)}
            size="small"
            aria-label="Sort order"
          >
            <ToggleButton value="newest" aria-label="Newest first">Newest</ToggleButton>
            <ToggleButton value="oldest" aria-label="Oldest first">Oldest</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", minHeight: 200 }}>
            <CircularProgress />
          </Box>
        ) : sortedMemories.length === 0 ? (
          <Typography color="text.secondary">No memories found for this person.</Typography>
        ) : (
          <PersonPhotoMasonry memories={sortedMemories} withTooltips />
        )}
      </Card>

      {/* Statistics Section */}
      <Card sx={{ mb: 4, p: 2 }}>
        <Typography variant="h6" gutterBottom>Statistics</Typography>
        <PersonStatistics memories={sortedMemories} />
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <WarningAmberIcon color="error" />
            <span>Delete Person</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to say goodbye to <b>{person?.name}</b>?
          </Typography>
          <Typography>
            This can&apos;t be undone. Their profile will be gone, but the {memories.length} {memories.length === 1 ? "memory" : "memories"} they were part of will live on.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary" disabled={deleting}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 