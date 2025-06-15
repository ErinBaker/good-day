"use client";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, gql, useApolloClient } from "@apollo/client";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import RelativeTime from '../../components/RelativeTime';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
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
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import Container from '@mui/material/Container';
import CloseIcon from '@mui/icons-material/Close';
import dynamic from 'next/dynamic';
import { AvatarGenerator } from 'random-avatar-generator';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import UpdateIcon from '@mui/icons-material/Update';
import PlaceIcon from '@mui/icons-material/Place';
import Tooltip from '@mui/material/Tooltip';
import DOMPurify from 'dompurify';

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

const MemoryLocationMap = dynamic(() => import('../../components/MemoryLocationMap'), { ssr: false });

const avatarGenerator = new AvatarGenerator();

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
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={0} sx={{ width: '100%', minHeight: 400 }}>
          {/* Left: Photo Skeleton */}
          <Box sx={{ width: { xs: '100%', md: '50%' }, minWidth: 0, height: { xs: 300, md: '100%' }, minHeight: { xs: 300, md: 400 }, display: 'flex', alignItems: 'stretch', justifyContent: 'center', position: 'relative', bgcolor: 'grey.100' }}>
            <Skeleton
              variant="rectangular"
              width="100%"
              height="100%"
              animation="wave"
              sx={{ borderRadius: '8px 8px 0 0', bgcolor: 'grey.100' }}
            />
          </Box>
          {/* Right: Details Skeleton */}
          <Box sx={{ width: { xs: '100%', md: '50%' }, minWidth: 0, p: { xs: 2, md: 6 }, bgcolor: 'background.paper', flex: 1, overflowY: 'auto' }}>
            <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} /> {/* Date */}
            <Skeleton variant="text" width="80%" height={48} sx={{ mb: 2 }} /> {/* Title */}
            <Skeleton variant="text" width="95%" height={32} sx={{ mb: 2 }} /> {/* Description */}
            <Skeleton variant="rectangular" width={180} height={36} sx={{ mb: 2, borderRadius: 2 }} /> {/* Chips */}
            <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1 }} /> {/* Metadata 1 */}
            <Skeleton variant="text" width="50%" height={24} sx={{ mb: 1 }} /> {/* Metadata 2 */}
            <Skeleton variant="text" width="40%" height={24} /> {/* Metadata 3 */}
            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Skeleton variant="rectangular" width={120} height={36} sx={{ borderRadius: 2 }} />
              <Skeleton variant="rectangular" width={120} height={36} sx={{ borderRadius: 2 }} />
            </Box>
          </Box>
        </Stack>
      )}
      {error && (
        <Alert severity="error">Error loading memory: {error.message}</Alert>
      )}
      {memory && (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={0} sx={{ width: '100%', minHeight: 400 }}>
          {/* Left: Photo */}
          <Box sx={{ width: { xs: '100%', md: '50%' }, minWidth: 0, height: { xs: 300, md: '100%' }, minHeight: { xs: 300, md: 400 }, display: 'flex', alignItems: 'stretch', justifyContent: 'center', position: 'relative', bgcolor: 'grey.100', boxShadow: 3, borderRadius: 2 }}>
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
                borderRadius: 2,
              }}
            />
            {/* Error overlay if image fails */}
            {imgError && (
              <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100', position: 'absolute', top: 0, left: 0, zIndex: 3, borderRadius: 2 }}>
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
                borderRadius: 2,
                boxShadow: 3,
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
            {/* Top Bar: Back, Pagination, Menu */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
              <Tooltip title="Back">
                <IconButton aria-label="Back" onClick={() => router.back()}>
                  <ArrowBackIcon />
                </IconButton>
              </Tooltip>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Tooltip title={memory.previousMemoryId ? 'Previous memory' : 'No previous memory'}>
                  <span>
                    <IconButton
                      aria-label="Previous memory"
                      onClick={() => memory.previousMemoryId && router.push(`/memory/${memory.previousMemoryId}`)}
                      disabled={!memory.previousMemoryId}
                      size="large"
                    >
                      <ArrowBackIosNewIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title={memory.nextMemoryId ? 'Next memory' : 'No next memory'}>
                  <span>
                    <IconButton
                      aria-label="Next memory"
                      onClick={() => memory.nextMemoryId && router.push(`/memory/${memory.nextMemoryId}`)}
                      disabled={!memory.nextMemoryId}
                      size="large"
                    >
                      <ArrowForwardIosIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
              <Tooltip title="Actions">
                <IconButton
                  aria-label="memory actions"
                  aria-controls={menuAnchorEl ? 'memory-actions-menu' : undefined}
                  aria-haspopup="true"
                  onClick={handleMenuOpen}
                >
                  <MoreVertIcon />
                </IconButton>
              </Tooltip>
            </Stack>
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
            <Stack spacing={2}>
              {/* Date */}
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="overline" sx={{ textTransform: 'uppercase' }} color="text.secondary" title={memory.date ? dayjs(memory.date).format('dddd MMMM D, YYYY [at] h:mma') : ''} aria-label={memory.date ? `Date: ${dayjs(memory.date).format('dddd MMMM D, YYYY [at] h:mma')}` : ''}>
                  {memory.date && <RelativeTime date={memory.date} />}
                </Typography>
              </Stack>
              {/* Title */}
              <Typography variant="h3" sx={{ fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1.1 }} component="h1">
                {memory.title}
              </Typography>
              {/* Description */}
              <Box sx={{ mb: 1 }}>
                {memory.description ? (
                  <div
                    style={{ fontSize: '1.25rem', lineHeight: 1.5 }}
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(memory.description) }}
                    aria-label="Memory description"
                  />
                ) : (
                  <Typography variant="h4" component="div">
                    You didn&apos;t add a note, but the feeling lingers.
                  </Typography>
                )}
              </Box>
              {/* People Chips */}
              <Box>
                {memory.people && memory.people.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                    {memory.people.map((person: { id: string; name: string; relationship?: string }) => {
                      const avatarUrl = person.name ? avatarGenerator.generateRandomAvatar(person.name) : undefined;
                      return (
                        <Tooltip key={person.id} title={person.relationship ? person.relationship : 'No relationship info'}>
                          <Chip
                            avatar={<Avatar src={avatarUrl} sx={{ width: 24, height: 24 }} alt={person.name} />}
                            label={person.name}
                            variant="outlined"
                            sx={{ fontSize: '1em', height: 32, cursor: 'pointer' }}
                            component="a"
                            href={`/people/${person.id}`}
                            clickable
                          />
                        </Tooltip>
                      );
                    })}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">No people tagged.</Typography>
                )}
              </Box>
              {/* Location Map */}
              {memory.location && typeof memory.location.lat === 'number' && typeof memory.location.lng === 'number' && (
                <Box sx={{ mb: 2 }}>
                  <MemoryLocationMap lat={memory.location.lat} lng={memory.location.lng} />
                </Box>
              )}
              {/* Metadata */}
              <Stack direction="row" spacing={2} alignItems="center">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <UpdateIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    <strong>Added:</strong> {memory.createdAt ? new Date(memory.createdAt).toLocaleString() : 'Unknown'}
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <UpdateIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    <strong>Last updated:</strong> {memory.updatedAt ? new Date(memory.updatedAt).toLocaleString() : 'Unknown'}
                  </Typography>
                </Stack>
                {memory.location && typeof memory.location.lat === 'number' && typeof memory.location.lng === 'number' && (
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <PlaceIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      <strong>Lat:</strong> {memory.location.lat.toFixed(5)}, <strong>Lng:</strong> {memory.location.lng.toFixed(5)}
                    </Typography>
                  </Stack>
                )}
              </Stack>
            </Stack>
          </Box>
        </Stack>
      )}
    </Container>
  );
} 