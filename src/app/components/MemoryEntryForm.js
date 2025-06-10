import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Box, Button, TextField, Typography } from '@mui/material';
import { useMutation, gql } from '@apollo/client';
import FileUpload from './FileUpload';

const CREATE_MEMORY = gql`
  mutation CreateMemory($title: String!, $date: String!, $description: String!) {
    createMemory(title: $title, date: $date, description: $description) {
      id
      title
      date
      description
    }
  }
`;

const LINK_PHOTO = gql`
  mutation LinkPhoto($photoId: String!, $memoryId: Int!) {
    linkPhoto: linkPhoto(photoId: $photoId, memoryId: $memoryId) {
      id
      memoryId
    }
  }
`;

function MemoryEntryForm({ onMemoryCreated }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();
  const [createMemory] = useMutation(CREATE_MEMORY);
  const [linkPhoto] = useMutation(LINK_PHOTO);
  const [uploadedPhotoIds, setUploadedPhotoIds] = useState([]);
  const [associatedPhotos, setAssociatedPhotos] = useState([]);

  // Called by FileUpload after successful upload
  const handleFileUpload = (result) => {
    if (result && result.id) {
      setUploadedPhotoIds((ids) => [...ids, result.id]);
      setAssociatedPhotos((photos) => [...photos, result]);
    }
  };

  const onSubmit = async (data) => {
    try {
      // 1. Create the memory
      const res = await createMemory({ variables: data });
      const memoryId = res.data.createMemory.id;
      // 2. Link all uploaded photos to this memory
      for (const photoId of uploadedPhotoIds) {
        await linkPhoto({ variables: { photoId, memoryId: parseInt(memoryId, 10) } });
      }
      // 3. Reset form and state
      reset();
      setUploadedPhotoIds([]);
      setAssociatedPhotos([]);
      if (onMemoryCreated) onMemoryCreated();
    } catch (err) {
      alert('Error creating memory: ' + err.message);
    }
  };

  const handleRemovePhoto = (photoId) => {
    setUploadedPhotoIds((ids) => ids.filter((id) => id !== photoId));
    setAssociatedPhotos((photos) => photos.filter((p) => p.id !== photoId));
    // Optionally, call unlink or delete photo API here
  };

  // Move photo up or down in the list
  const movePhoto = (index, direction) => {
    setAssociatedPhotos((photos) => {
      const newPhotos = [...photos];
      const target = newPhotos[index];
      newPhotos.splice(index, 1);
      newPhotos.splice(index + direction, 0, target);
      return newPhotos;
    });
    setUploadedPhotoIds((ids) => {
      const newIds = [...ids];
      const target = newIds[index];
      newIds.splice(index, 1);
      newIds.splice(index + direction, 0, target);
      return newIds;
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Typography variant="h6">Create Memory</Typography>
      <TextField
        label="Title"
        fullWidth
        margin="normal"
        {...register('title', { required: true })}
        error={!!errors.title}
        helperText={errors.title && 'Title is required'}
      />
      <TextField
        label="Date"
        type="date"
        fullWidth
        margin="normal"
        InputLabelProps={{ shrink: true }}
        {...register('date', { required: true })}
        error={!!errors.date}
        helperText={errors.date && 'Date is required'}
      />
      <TextField
        label="Description"
        fullWidth
        margin="normal"
        multiline
        minRows={3}
        {...register('description', { required: true })}
        error={!!errors.description}
        helperText={errors.description && 'Description is required'}
      />
      <FileUpload onFileSelect={handleFileUpload} />
      {associatedPhotos.length > 0 && (
        <Box mt={2}>
          <Typography variant="subtitle1">Photos to be associated:</Typography>
          <Box display="flex" gap={2} mt={1}>
            {associatedPhotos.map((photo, idx) => (
              <Box key={photo.id}>
                <img
                  src={`/api/photos/${photo.folder}/${photo.baseFilename}?size=thumbnail`}
                  alt="Memory"
                  style={{ maxWidth: 80, borderRadius: 8, display: 'block' }}
                />
                <Box display="flex" flexDirection="column" alignItems="center" mt={1}>
                  <Button size="small" color="error" onClick={() => handleRemovePhoto(photo.id)}>
                    Remove
                  </Button>
                  <Button size="small" disabled={idx === 0} onClick={() => movePhoto(idx, -1)}>
                    Up
                  </Button>
                  <Button
                    size="small"
                    disabled={idx === associatedPhotos.length - 1}
                    onClick={() => movePhoto(idx, 1)}
                  >
                    Down
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}
      <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
        Create Memory
      </Button>
    </Box>
  );
}

export default MemoryEntryForm;
