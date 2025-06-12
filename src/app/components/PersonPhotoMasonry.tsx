import React from "react";
import ImageList from "@mui/material/ImageList";
import ImageListItem from "@mui/material/ImageListItem";
import Box from "@mui/material/Box";
import Link from "next/link";
import Tooltip from "@mui/material/Tooltip";

interface Memory {
  id: string;
  photoUrl?: string;
  title?: string;
  date?: string;
}

interface PersonPhotoMasonryProps {
  memories: Memory[];
  withTooltips?: boolean;
}

const PHOTO_PLACEHOLDER =
  "https://placehold.co/600x400?text=No+Image&font=roboto&size=32&bg=ececec&fg=888&format=webp";

const PersonPhotoMasonry: React.FC<PersonPhotoMasonryProps> = ({ memories, withTooltips }) => {
  if (!memories || memories.length === 0) return null;

  return (
    <ImageList
      variant="quilted"
      cols={3}
      gap={12}
      sx={{ width: '100%', maxWidth: 900, mx: 'auto',
        gridTemplateColumns: {
          xs: 'repeat(1, 1fr) !important',
          sm: 'repeat(2, 1fr) !important',
          md: 'repeat(3, 1fr) !important',
        }
      }}
      aria-label="Memories photo grid"
    >
      {memories.map((memory) => {
        const img = (
          <Box
            component="img"
            src={memory.photoUrl || PHOTO_PLACEHOLDER}
            alt={memory.title || "Memory photo"}
            sx={{ width: '100%', display: 'block', cursor: 'pointer', borderRadius: 2, transition: 'box-shadow 0.2s', boxShadow: 1, '&:hover': { boxShadow: 6 } }}
            tabIndex={0}
            loading="lazy"
          />
        );
        return (
          <ImageListItem key={memory.id} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Link href={`/memory/${memory.id}`} passHref legacyBehavior>
              {withTooltips ? (
                <Tooltip title={<span><strong>{memory.title || 'Untitled'}</strong><br/>{memory.date ? new Date(memory.date).toLocaleDateString() : ''}</span>} arrow>
                  {img}
                </Tooltip>
              ) : img}
            </Link>
          </ImageListItem>
        );
      })}
    </ImageList>
  );
};

export default PersonPhotoMasonry; 