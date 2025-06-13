"use client";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, gql, useApolloClient } from "@apollo/client";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import RelativeTime from '../../components/RelativeTime';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import dayjs from 'dayjs';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Container from '@mui/material/Container';
import CloseIcon from '@mui/icons-material/Close';

const MEMORY_DETAIL_QUERY = gql`
  query Memory($id: ID!) {
    memory(id: $id) {
      id
      title
      date
      description
      photoUrl
      createdAt
      updatedAt
      people { id name relationship }
      photos { id originalFilename folder baseFilename mimeType size width height createdAt }
      previousMemoryId
      nextMemoryId
      location { lat lng }
    }
  }
`;

const DELETE_MEMORY_MUTATION = gql`
  mutation DeleteMemory($id: ID!) {
    deleteMemory(id: $id)
  }
`;

export default function MemoryDetailPage() {
  const params = useParams();
  const id = params && typeof params.id !== 'undefined' ? (Array.isArray(params.id) ? params.id[0] : params.id) : '';
  const { data, loading, error } = useQuery(MEMORY_DETAIL_QUERY, { variables: { id } });
  const memory = data?.memory;
  const [imgLoaded, setImgLoaded] = React.useState(false);
  const [imgError, setImgError] = React.useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const router = useRouter();
  const client = useApolloClient();
  const [deleteMemory, { loading: deleting }] = useMutation(DELETE_MEMORY_MUTATION, {
    variables: { id },
    onCompleted: async () => {
      setDeleteDialogOpen(false);
      await client.refetchQueries({ include: ["Memories"] });
      router.push("/");
    },
    onError: () => {
      setDeleteDialogOpen(false);
      // TODO: Show error feedback
    },
  });
  const [lightboxOpen, setLightboxOpen] = React.useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  const handleEdit = () => {
    handleMenuClose();
    router.push(`/memory/${id}/edit`);
  };
  const handleDelete = () => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  };
  const handleDeleteConfirm = () => {
    deleteMemory();
  };
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 6 }, px: { xs: 0, sm: 2 }, minHeight: '100vh' }}>
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Alert severity="error">Error loading memory: {error.message}</Alert>
      )}
      {memory && (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={0} sx={{ width: '100%', minHeight: 400 }}>
          {/* Left: Photo */}
          <Box sx={{ width: { xs: '100%', md: '50%' }, minWidth: 0, height: { xs: 300, md: '100%' }, minHeight: { xs: 300, md: 400 }, display: 'flex', alignItems: 'stretch', justifyContent: 'center', position: 'relative', bgcolor: 'grey.100' }}>
            {/* Skeleton always rendered behind the image */}
            <Skeleton
              variant="rectangular"
              width="100%"
              height="100%"
              animation="wave"
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 1,
                transition: 'opacity 0.3s',
                opacity: imgLoaded || imgError ? 0 : 1,
                pointerEvents: 'none',
              }}
            />
            {/* Error overlay if image fails */}
            {imgError && (
              <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100', position: 'absolute', top: 0, left: 0, zIndex: 3 }}>
                <Typography color="text.secondary">Image not available</Typography>
              </Box>
            )}
            {/* Image always rendered, opacity/transition controlled */}
            <Box
              component="img"
              src={memory.photoUrl}
              alt={memory.title}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: imgLoaded && !imgError ? 1 : 0,
                transition: 'opacity 0.3s',
                background: 'transparent',
                display: 'block',
                zIndex: 2,
                cursor: 'zoom-in',
              }}
              onClick={() => !imgError && setLightboxOpen(true)}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              draggable={false}
              tabIndex={0}
              aria-label="Open full image"
            />
            {/* Lightbox Dialog */}
            <Dialog open={lightboxOpen} onClose={() => setLightboxOpen(false)} maxWidth={false} PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none', m: 0, p: 0 } }}>
              <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.92)', zIndex: 1300 }}>
                <IconButton onClick={() => setLightboxOpen(false)} sx={{ position: 'absolute', top: 24, right: 24, color: '#fff', bgcolor: 'rgba(0,0,0,0.4)', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }, zIndex: 1400 }} aria-label="Close full image">
                  <CloseIcon fontSize="large" />
                </IconButton>
                <Box component="img" src={memory.photoUrl} alt={memory.title} sx={{ maxWidth: '98vw', maxHeight: '96vh', objectFit: 'contain', boxShadow: 6, borderRadius: 2, outline: 'none' }} draggable={false} />
              </Box>
            </Dialog>
          </Box>
          {/* Right: Details */}
          <Box sx={{ width: { xs: '100%', md: '50%' }, minWidth: 0, p: { xs: 2, md: 6 }, bgcolor: 'background.paper', position: 'relative', flex: 1, overflowY: 'auto' }}>
            {/* Context Menu Trigger */}
            <IconButton
              aria-label="memory actions"
              aria-controls={menuAnchorEl ? 'memory-actions-menu' : undefined}
              aria-haspopup="true"
              onClick={handleMenuOpen}
              sx={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}
            >
              <MoreVertIcon />
            </IconButton>
            <Menu
              id="memory-actions-menu"
              anchorEl={menuAnchorEl}
              open={Boolean(menuAnchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem onClick={handleEdit}>Edit</MenuItem>
              <MenuItem onClick={handleDelete}>Delete</MenuItem>
            </Menu>
            {/* Delete Confirmation Dialog */}
            <Dialog
              open={deleteDialogOpen}
              onClose={handleDeleteCancel}
              aria-labelledby="delete-memory-dialog-title"
            >
              <DialogTitle id="delete-memory-dialog-title">Delete Memory</DialogTitle>
              <DialogContent>
                <Typography>Let go of this memory?</Typography>
                <Typography>It will be permanently deleted, but the people you shared it with will not be affected.
                This is a permanent action.</Typography>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleDeleteCancel} color="primary" disabled={deleting}>Cancel</Button>
                <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleting}>
                  {deleting ? 'Deleting...' : 'Delete'}
                </Button>
              </DialogActions>
            </Dialog>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }} title={memory.date ? dayjs(memory.date).format('dddd MMMM D, YYYY [at] h:mma') : ''} aria-label={memory.date ? `Date: ${dayjs(memory.date).format('dddd MMMM D, YYYY [at] h:mma')}` : ''}>
            Looking back to {memory.date && <RelativeTime date={memory.date} />}
            </Typography>
            <Typography variant="h3" sx={{ mb: 1, fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1.1 }} component="h1">
              {memory.title}
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h4" component="div" sx={{ mb: 1 }}>
                {memory.description || <span>You didn&apos;t add a note, but the feeling lingers.</span>}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>The People in This Moment</Typography>
              {memory.people && memory.people.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                  {memory.people.map((person: { id: string; name: string; relationship?: string }) => (
                    <Chip
                      key={person.id}
                      avatar={<Avatar sx={{ width: 24, height: 24 }}>{person.name[0]}</Avatar>}
                      label={person.relationship ? `${person.name} (${person.relationship})` : person.name}
                      variant="outlined"
                      sx={{ fontSize: '1em', height: 32, cursor: 'pointer' }}
                      component="a"
                      href={`/people/${person.id}`}
                      clickable
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">No people tagged.</Typography>
              )}
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>Metadata</Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Created:</strong> {memory.createdAt ? new Date(memory.createdAt).toLocaleString() : 'Unknown'}<br />
                <strong>Last Updated:</strong> {memory.updatedAt ? new Date(memory.updatedAt).toLocaleString() : 'Unknown'}
              </Typography>
              {memory.location && typeof memory.location.lat === 'number' && typeof memory.location.lng === 'number' && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  <span role="img" aria-label="Location">📍</span> Latitude: {memory.location.lat.toFixed(5)}, Longitude: {memory.location.lng.toFixed(5)}
                </Typography>
              )}
            </Box>
            {/* Previous/Next Navigation */}
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 3 }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => memory.previousMemoryId && router.push(`/memory/${memory.previousMemoryId}`)}
                disabled={!memory.previousMemoryId}
                aria-label="Previous memory"
              >
                Previous
              </Button>
              <Button
                variant="outlined"
                endIcon={<ArrowForwardIcon />}
                onClick={() => memory.nextMemoryId && router.push(`/memory/${memory.nextMemoryId}`)}
                disabled={!memory.nextMemoryId}
                aria-label="Next memory"
              >
                Next
              </Button>
            </Box>
          </Box>
        </Stack>
      )}
    </Container>
  );
} 