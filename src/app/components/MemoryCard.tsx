"use client";
import React, { useRef, useState, useEffect } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import Fade from '@mui/material/Fade';
import { useTheme } from '@mui/material/styles';
import Link from 'next/link';
import RelativeTime from './RelativeTime';
import { AvatarGenerator } from 'random-avatar-generator';

export interface MemoryCardProps {
  id: string;
  title?: string;
  photoUrl?: string;
  people: { id: string; name: string; relationship?: string }[];
  description: string;
  date?: string;
  animate?: boolean;
  selected?: boolean;
}

const PHOTO_PLACEHOLDER =
  'https://placehold.co/600x400?text=No+Image&font=roboto&size=32&bg=ececec&fg=888&format=webp'; // 3:4 portrait placeholder

const avatarGenerator = new AvatarGenerator();

export const MemoryCard: React.FC<MemoryCardProps> = ({ id, title, photoUrl, people, description, date, animate = true, selected = false }) => {
  const [imgSrc, setImgSrc] = useState<string | undefined>(undefined);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const resolvedUrl = photoUrl && photoUrl.trim() !== '' ? photoUrl : PHOTO_PLACEHOLDER;
    setImgSrc(resolvedUrl);
  }, [photoUrl]);

  const card = (
    <Link
      href={`/memory/${id}`}
      passHref
      style={{ textDecoration: 'none', width: '100%', display: 'block' }}
      tabIndex={0}
      aria-label={`View details for memory: ${title}`}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 640,
          height: 'auto',
          mx: 'auto',
          display: 'flex',
          flexDirection: 'column',
          mb: 2,
          boxShadow: 3,
          borderRadius: 2,
          transition: 'box-shadow 0.2s, transform 0.2s, background 0.2s',
          outline: 'none',
          bgcolor: selected ? theme.palette.action.selected : 'background.paper',
          p: { xs: 1, sm: 2 },
          cursor: 'pointer',
          border: selected ? '3px solid' : undefined,
          borderColor: selected ? theme.palette.primary.main : undefined,
          '&:hover, &:focus-visible': {
            boxShadow: 8,
            transform: 'scale(1.01)',
            background: theme.palette.action.hover,
            border: '2px solid',
            borderColor: 'primary.main',
          },
        }}
        aria-labelledby={`memory-title-${id}`}
        role="article"
        tabIndex={-1}
      >
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f5f5f5', borderRadius: '8px 8px 0 0' }}>
          <CardMedia
            component="img"
            ref={imgRef}
            src={imgSrc}
            alt={title}
            sx={{
              height: 640,
              objectFit: 'cover',
              background: '#f5f5f5',
              display: 'block',
              margin: '0 auto',
              borderRadius: '8px 8px 0 0',
            }}
          />
        </Box>
        <CardContent sx={{ flex: 1, minWidth: 0, p: { xs: 1, sm: 2 } }}>
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
              <Typography variant="caption" color="text.secondary" title={new Date(date).toISOString()} aria-label={`Date: ${new Date(date).toISOString()}`}>
                <RelativeTime date={date} />
              </Typography>
            )}
            {people.length > 0 && (
              <Stack direction="row" spacing={1} alignItems="center">
                {people.map((person) => {
                  const avatarUrl = person.name ? avatarGenerator.generateRandomAvatar(person.name) : undefined;
                  return (
                    <Box key={person.id} sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                      <Avatar
                        src={avatarUrl}
                        alt={person.name}
                        sx={{ width: 24, height: 24, mr: 0.5 }}
                        imgProps={{ 'aria-label': person.name }}
                      />
                      <Typography variant="caption" sx={{ mr: 1 }}>
                        {person.name}
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Link>
  );

  return animate ? (
    <Fade in={mounted} timeout={500} appear>
      <div style={{ width: '100%' }}>{card}</div>
    </Fade>
  ) : (
    card
  );
};

export default MemoryCard; 