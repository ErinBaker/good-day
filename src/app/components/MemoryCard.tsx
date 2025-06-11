import React, { useRef, useState, useEffect } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';

export interface MemoryCardProps {
  id: string;
  title?: string;
  photoUrl?: string;
  people: { id: string; name: string; relationship?: string }[];
  description: string;
  date?: string;
}

const AVATAR_PLACEHOLDER =
  'https://mui.com/static/images/avatar/1.jpg'; // MUI demo placeholder
const PHOTO_PLACEHOLDER =
  'https://placehold.co/450x600?text=No+Image&font=roboto&size=32&bg=ececec&fg=888&format=webp'; // 3:4 portrait placeholder

export const MemoryCard: React.FC<MemoryCardProps> = ({ id, title, photoUrl, people, description, date }) => {
  const [imgSrc, setImgSrc] = useState<string | undefined>(undefined);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Lazy load image using Intersection Observer
  useEffect(() => {
    // Set image source immediately, no lazy loading
    const resolvedUrl = photoUrl && photoUrl.trim() !== '' ? photoUrl : PHOTO_PLACEHOLDER;
    setImgSrc(resolvedUrl);
  }, [photoUrl]);

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        mb: 2,
        boxShadow: 3,
        borderRadius: 2,
        maxWidth: 600,
        mx: 'auto',
      }}
      aria-labelledby={`memory-title-${id}`}
      role="article"
    >
      <CardMedia
        component="img"
        ref={imgRef}
        src={imgSrc}
        alt={title}
        sx={{
          width: '100%',
          height: 340,
          objectFit: 'cover',
          borderRadius: '8px 8px 0 0',
        }}
      />
      <CardContent sx={{ flex: 1, minWidth: 0 }}>
        {title && (
          <Typography id={`memory-title-${id}`} variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
            {title}
          </Typography>
        )}
        <Typography variant="body1" sx={{ mb: 2 }}>
          {description}
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2, flexWrap: 'wrap' }}>
          {date && (
            <Typography variant="caption" color="text.secondary">
              {new Date(date).toLocaleDateString()}
            </Typography>
          )}
          {people.length > 0 && (
            <Stack direction="row" spacing={1} alignItems="center">
              {people.map((person) => (
                <Box key={person.id} sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                  <Avatar
                    src={AVATAR_PLACEHOLDER}
                    alt={person.name}
                    sx={{ width: 24, height: 24, mr: 0.5 }}
                    imgProps={{ 'aria-label': person.name }}
                  />
                  <Typography variant="caption" sx={{ mr: 1 }}>
                    {person.name}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default MemoryCard; 