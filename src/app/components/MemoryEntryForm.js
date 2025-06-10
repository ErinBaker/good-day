import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Box, Button, TextField, Typography, Alert, Snackbar, IconButton, Grid } from '@mui/material';
import { useMutation, gql } from '@apollo/client';
import FileUpload from './FileUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import PersonSelection from './PersonSelection';

const CREATE_MEMORY = gql`
  mutation CreateMemory($title: String!, $date: String!, $description: String!, $peopleIds: [ID!]) {
    createMemory(input: { title: $title, date: $date, description: $description, peopleIds: $peopleIds }) {
      id
      title
      date
      description
      people { id name relationship }
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
  const [alert, setAlert] = useState({ message: '', severity: 'success', open: false });
  const [selectedPeople, setSelectedPeople] = useState([]);

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
      const res = await createMemory({ variables: { ...data, peopleIds: selectedPeople.map(p => p.id) } });
      const memoryId = res.data.createMemory.id;
      // 2. Link all uploaded photos to this memory
      for (const photoId of uploadedPhotoIds) {
        await linkPhoto({ variables: { photoId, memoryId: parseInt(memoryId, 10) } });
      }
      // 3. Reset form and state
      reset();
      setUploadedPhotoIds([]);
      setAssociatedPhotos([]);
      setSelectedPeople([]);
      setAlert({ message: 'Memory created successfully!', severity: 'success', open: true });
      if (onMemoryCreated) onMemoryCreated();
    } catch (err) {
      setAlert({ message: 'Error creating memory: ' + err.message, severity: 'error', open: true });
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
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ maxWidth: 600, my: 2, p: 3, borderRadius: 2, boxShadow: 1, bgcolor: 'background.paper' }}>
      <Typography variant="h6" gutterBottom>Create Memory</Typography>
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
      <PersonSelection value={selectedPeople} onChange={setSelectedPeople} label="Tag People" placeholder="Search or add a person..." />
      <FileUpload onFileSelect={handleFileUpload} />
      {associatedPhotos.length > 0 && (
        <Box mt={2}>
          <Typography variant="subtitle1">Photos to be associated:</Typography>
          <Grid container spacing={2} mt={1}>
            {associatedPhotos.map((photo, idx) => (
              <Grid item key={photo.id}>
                <Box display="flex" flexDirection="column" alignItems="center">
                  <img
                    src={`/api/photos/${photo.folder}/${photo.baseFilename}?size=thumbnail`}
                    alt="Memory"
                    style={{ maxWidth: 80, borderRadius: 8, display: 'block' }}
                  />
                  <Box display="flex" gap={1} mt={1}>
                    <IconButton aria-label="Remove photo" color="error" onClick={() => handleRemovePhoto(photo.id)} size="small">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                    <IconButton aria-label="Move photo up" disabled={idx === 0} onClick={() => movePhoto(idx, -1)} size="small">
                      <ArrowUpwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton aria-label="Move photo down" disabled={idx === associatedPhotos.length - 1} onClick={() => movePhoto(idx, 1)} size="small">
                      <ArrowDownwardIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button type="submit" variant="contained" color="primary">
          Create Memory
        </Button>
      </Box>
      <Snackbar
        open={alert.open}
        autoHideDuration={4000}
        onClose={() => setAlert(a => ({ ...a, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {alert.message && (
          <Alert onClose={() => setAlert(a => ({ ...a, open: false }))} severity={alert.severity} sx={{ width: '100%' }}>
            {alert.message}
          </Alert>
        )}
      </Snackbar>
    </Box>
  );
}

export default MemoryEntryForm;
