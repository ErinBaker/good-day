"use client";
import React from "react";
import { useParams } from "next/navigation";
import { useQuery, gql } from "@apollo/client";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import RelativeTime from '../../components/RelativeTime';

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
    }
  }
`;

export default function MemoryDetailPage() {
  const params = useParams();
  const id = params && typeof params.id !== 'undefined' ? (Array.isArray(params.id) ? params.id[0] : params.id) : '';
  const { data, loading, error } = useQuery(MEMORY_DETAIL_QUERY, { variables: { id } });
  const memory = data?.memory;
  const [imgLoaded, setImgLoaded] = React.useState(false);
  const [imgError, setImgError] = React.useState(false);

  return (
    <Box sx={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Alert severity="error">Error loading memory: {error.message}</Alert>
      )}
      {memory && (
        <Stack direction={{ xs: 'column', md: 'row' }} sx={{ height: '100vh', width: '100vw' }}>
          {/* Left: Photo */}
          <Box sx={{ width: { xs: '100%', md: '50%' }, height: { xs: 300, md: '100vh' }, position: 'relative' }}>
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
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 2,
                opacity: imgLoaded && !imgError ? 1 : 0,
                transition: 'opacity 0.3s',
                background: 'transparent',
                pointerEvents: 'none',
                display: 'block',
              }}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              draggable={false}
            />
          </Box>
          {/* Right: Details */}
          <Box sx={{ width: { xs: '100%', md: '50%' }, height: { xs: 'auto', md: '100vh' }, overflowY: 'auto', p: { xs: 2, md: 6 }, bgcolor: 'background.paper' }}>
            <Typography variant="h3" sx={{ mb: 1, fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1.1 }}>
              {memory.title}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }} title={memory.date ? new Date(memory.date).toISOString() : ''} aria-label={memory.date ? `Date: ${new Date(memory.date).toISOString()}` : ''}>
              {memory.date && <RelativeTime date={memory.date} />}<br />
              <span style={{ fontSize: '0.9em', color: '#888' }}>{memory.date ? new Date(memory.date).toISOString() : ''}</span>
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {memory.description}
            </Typography>
            {/* ...stub for metadata, people, actions, navigation... */}
          </Box>
        </Stack>
      )}
    </Box>
  );
} 