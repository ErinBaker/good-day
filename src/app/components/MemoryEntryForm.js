import React, { useState } from 'react';
import { Box, Button, Typography, Stepper, Step, StepLabel, StepContent, Alert, Snackbar, CircularProgress } from '@mui/material';
import { useMutation, gql } from '@apollo/client';
import FileUpload from './FileUpload';
import PersonSelection from './PersonSelection';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { TextField } from '@mui/material';
import exifr from 'exifr';

const CREATE_MEMORY = gql`
  mutation CreateMemory($title: String!, $date: String!, $description: String!, $photoUrl: String!, $location: LocationInput) {
    createMemory(input: { title: $title, date: $date, description: $description, photoUrl: $photoUrl, location: $location }) {
      id
      title
      date
      description
      photoUrl
    }
  }
`;

const ADD_PEOPLE = gql`
  mutation AddPeople($memoryId: ID!, $input: MemoryUpdateInput!) {
    updateMemory(id: $memoryId, input: $input) {
      id
      people { id name relationship }
    }
  }
`;

function MemoryEntryForm({ onMemoryCreated }) {
  // Stepper state
  const [activeStep, setActiveStep] = useState(0);

  // Step 1: Photo upload
  const [photoFile, setPhotoFile] = useState(null);
  const [photoError, setPhotoError] = useState('');

  // Step 2: Details
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(dayjs());
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState({ lat: '', lng: '' });
  const [detailsError, setDetailsError] = useState('');
  const [creatingMemory, setCreatingMemory] = useState(false);
  const [memoryId, setMemoryId] = useState(null);

  // Step 3: People
  const [selectedPeople, setSelectedPeople] = useState([]);
  const [peopleError, setPeopleError] = useState('');
  const [addingPeople, setAddingPeople] = useState(false);

  // General alert
  const [alert, setAlert] = useState({ message: '', severity: 'success', open: false });

  const [createMemory] = useMutation(CREATE_MEMORY);
  const [addPeople] = useMutation(ADD_PEOPLE);

  // Step 1: Handle file select (no upload yet)
  const handleFileSelect = async (file) => {
    setPhotoError('');
    setPhotoFile(file);
    if (file) {
      // Extract EXIF metadata
      try {
        const exif = await exifr.parse(file, { gps: true });
        // Date
        if (exif?.DateTimeOriginal || exif?.CreateDate) {
          setDate(dayjs(exif.DateTimeOriginal || exif.CreateDate));
        }
        // Location
        if (exif?.latitude && exif?.longitude) {
          setLocation({ lat: exif.latitude.toString(), lng: exif.longitude.toString() });
        } else {
          setLocation({ lat: '', lng: '' });
        }
      } catch {
        // Ignore EXIF errors, just don't autofill
      }
      setActiveStep(1);
    }
  };

  // Step 2: Handle details submit (upload image now, then create memory)
  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    setDetailsError('');
    if (!title.trim() || !date || !description.trim()) {
      setDetailsError('All fields are required.');
      return;
    }
    if (!photoFile) {
      setDetailsError('Photo is required.');
      return;
    }
    // Validate location if present
    if ((location.lat && isNaN(Number(location.lat))) || (location.lng && isNaN(Number(location.lng)))) {
      setDetailsError('Latitude and longitude must be numbers.');
      return;
    }
    setCreatingMemory(true);
    try {
      // Upload the image
      const formData = new FormData();
      formData.append('photo', photoFile);
      const res = await fetch('/api/photos/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.folder || !data.baseFilename) {
        setDetailsError(data.error || 'Photo upload failed.');
        setCreatingMemory(false);
        return;
      }
      const photoUrl = `/api/photos/${data.folder}/${data.baseFilename}`;
      // Create the memory
      const gqlRes = await createMemory({
        variables: {
          title: title.trim(),
          date: date ? date.toISOString() : dayjs().toISOString(),
          description: description.trim(),
          photoUrl,
          location: location.lat && location.lng ? { lat: parseFloat(location.lat), lng: parseFloat(location.lng) } : null,
        },
      });
      setMemoryId(gqlRes.data.createMemory.id);
      setActiveStep(2);
    } catch (err) {
      setDetailsError('Error creating memory: ' + (err?.message || err));
    } finally {
      setCreatingMemory(false);
    }
  };

  // Step 3: Handle people submit
  const handlePeopleSubmit = async (e) => {
    e.preventDefault();
    setPeopleError('');
    if (!selectedPeople.length) {
      setPeopleError('Please tag at least one person.');
      return;
    }
    setAddingPeople(true);
    try {
      await addPeople({
        variables: {
          memoryId,
          input: {
            peopleIds: selectedPeople.map((p) => p.id),
          },
        },
      });
      setAlert({ message: 'Memory created successfully!', severity: 'success', open: true });
      // Reset all state
      setActiveStep(0);
      setPhotoFile(null);
      setTitle('');
      setDate(dayjs());
      setDescription('');
      setSelectedPeople([]);
      setMemoryId(null);
      if (onMemoryCreated) onMemoryCreated();
    } catch (err) {
      setPeopleError('Error tagging people: ' + err.message);
    } finally {
      setAddingPeople(false);
    }
  };

  // Stepper steps
  const steps = [
    {
      label: 'Upload Photo',
      content: (
        <Box>
          <FileUpload onFileSelect={handleFileSelect} />
          {photoError && <Alert severity="error" sx={{ mt: 2 }}>{photoError}</Alert>}
        </Box>
      ),
    },
    {
      label: 'Add Title, Date, Description',
      content: (
        <Box component="form" onSubmit={handleDetailsSubmit} sx={{ mt: 1 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Enter details for your memory</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              fullWidth
              required
              inputProps={{ maxLength: 80 }}
            />
            <DatePicker
              label="Date"
              value={date}
              onChange={newValue => setDate(newValue)}
              slotProps={{ textField: { required: true, fullWidth: true, size: 'medium' } }}
              format="DD/MM/YYYY"
            />
            <TextField
              label="Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              fullWidth
              required
              multiline
              minRows={3}
              inputProps={{ maxLength: 500 }}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Latitude"
                value={location.lat}
                onChange={e => setLocation(l => ({ ...l, lat: e.target.value }))}
                fullWidth
                type="number"
                inputProps={{ step: 'any', min: -90, max: 90 }}
                placeholder="Latitude"
              />
              <TextField
                label="Longitude"
                value={location.lng}
                onChange={e => setLocation(l => ({ ...l, lng: e.target.value }))}
                fullWidth
                type="number"
                inputProps={{ step: 'any', min: -180, max: 180 }}
                placeholder="Longitude"
              />
            </Box>
          </Box>
          {detailsError && <Alert severity="error" sx={{ mt: 2 }}>{detailsError}</Alert>}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={creatingMemory}
              startIcon={creatingMemory ? <CircularProgress size={18} /> : null}
            >
              Next
            </Button>
          </Box>
        </Box>
      ),
    },
    {
      label: 'Add People',
      content: (
        <Box component="form" onSubmit={handlePeopleSubmit} sx={{ mt: 1 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Tag people in this memory</Typography>
          <PersonSelection value={selectedPeople} onChange={setSelectedPeople} />
          {peopleError && <Alert severity="error" sx={{ mt: 2 }}>{peopleError}</Alert>}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={addingPeople}
              startIcon={addingPeople ? <CircularProgress size={18} /> : null}
            >
              Finish
            </Button>
          </Box>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ maxWidth: 600, my: 2, p: 3, borderRadius: 2, boxShadow: 1, bgcolor: 'background.paper' }}>
      <Typography variant="h6" gutterBottom>Create Memory</Typography>
      <Stepper activeStep={activeStep} orientation="vertical" sx={{ mb: 2 }}>
        {steps.map((step, idx) => (
          <Step key={step.label} completed={activeStep > idx}>
            <StepLabel>{step.label}</StepLabel>
            <StepContent>{activeStep === idx && step.content}</StepContent>
          </Step>
        ))}
      </Stepper>
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
