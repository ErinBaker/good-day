import React, { useRef, useState, useEffect } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';

export interface MemoryCardProps {
  id: string;
  title?: string;
  photoUrl?: string;
  people: { id: string; name: string; relationship?: string }[];
  description: string;
}

const AVATAR_PLACEHOLDER =
  'https://mui.com/static/images/avatar/1.jpg'; // MUI demo placeholder
const PHOTO_PLACEHOLDER =
  'https://mui.com/static/images/cards/contemplative-reptile.jpg'; // MUI demo placeholder

export const MemoryCard: React.FC<MemoryCardProps> = ({ id, title, photoUrl, people, description }) => {
  const [imgSrc, setImgSrc] = useState<string | undefined>(undefined);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Lazy load image using Intersection Observer
  useEffect(() => {
    const node = imgRef.current;
    if (!node) return;
    let observer: IntersectionObserver | null = null;

    // Ensure photoUrl points to /uploads if not already
    let resolvedUrl = photoUrl;
    if (photoUrl && !photoUrl.startsWith('/uploads')) {
      const uploadsIndex = photoUrl.indexOf('/uploads/');
      if (uploadsIndex !== -1) {
        resolvedUrl = photoUrl.substring(uploadsIndex);
      }
    }

    if ('IntersectionObserver' in window) {
      observer = new window.IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setImgSrc(resolvedUrl || PHOTO_PLACEHOLDER);
              observer?.disconnect();
            }
          });
        },
        { threshold: 0.1 }
      );
      observer.observe(node);
    } else {
      // Fallback: load immediately
      setImgSrc(resolvedUrl || PHOTO_PLACEHOLDER);
    }
    return () => observer?.disconnect();
  }, [photoUrl]);

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { sm: 'center' },
        mb: 2,
        boxShadow: 3,
        borderRadius: 2,
        minHeight: 160,
        maxWidth: 600,
        mx: 'auto',
      }}
      aria-labelledby={`memory-title-${id}`}
      role="article"
    >
      <Box sx={{ width: { xs: '100%', sm: 180 }, height: 160, position: 'relative', flexShrink: 0 }}>
        {!imgSrc && <Skeleton variant="rectangular" width="100%" height={160} />}
        <CardMedia
          component="img"
          ref={imgRef}
          src={imgSrc}
          alt={title}
          sx={{
            width: '100%',
            height: 160,
            objectFit: 'cover',
            display: imgSrc ? 'block' : 'none',
            borderRadius: { xs: '8px 8px 0 0', sm: '8px 0 0 8px' },
          }}
        />
      </Box>
      <CardContent sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
          {people.length > 0 ? (
            people.map((person) => (
              <Box key={person.id} sx={{ display: 'flex', alignItems: 'center', mr: 1, mb: 0.5 }}>
                <Avatar
                  src={AVATAR_PLACEHOLDER}
                  alt={person.name}
                  sx={{ width: 28, height: 28, mr: 0.5 }}
                  imgProps={{ 'aria-label': person.name }}
                />
                <Typography variant="body2" sx={{ mr: 1 }}>
                  {person.name}
                </Typography>
              </Box>
            ))
          ) : null}
        </Stack>
        <Typography variant="body1" sx={{ mt: 1 }}>
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default MemoryCard; 