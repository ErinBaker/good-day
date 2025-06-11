import React, { useState } from 'react';
import { Box, Button, Typography, Stepper, Step, StepLabel, StepContent, Alert, Snackbar, CircularProgress } from '@mui/material';
import { useMutation, gql } from '@apollo/client';
import FileUpload from './FileUpload';
import PersonSelection from './PersonSelection';

const CREATE_MEMORY = gql`
  mutation CreateMemory($title: String!, $date: String!, $description: String!, $photoUrl: String!) {
    createMemory(input: { title: $title, date: $date, description: $description, photoUrl: $photoUrl }) {
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
  const [photoResult, setPhotoResult] = useState(null);
  const [photoError, setPhotoError] = useState('');

  // Step 2: Details
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
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

  // Step 1: Handle photo upload
  const handleFileSelect = async (result) => {
    setPhotoError('');
    setPhotoResult(null);
    if (!result || !result.folder || !result.baseFilename) {
      setPhotoError('Photo upload failed.');
      return;
    }
    setPhotoResult(result);
    setActiveStep(1);
  };

  // Step 2: Handle details submit
  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    setDetailsError('');
    if (!title.trim() || !date || !description.trim()) {
      setDetailsError('All fields are required.');
      return;
    }
    if (!photoResult) {
      setDetailsError('Photo is required.');
      return;
    }
    setCreatingMemory(true);
    try {
      const photoUrl = `/api/photos/${photoResult.folder}/${photoResult.baseFilename}`;
      const res = await createMemory({
        variables: {
          title: title.trim(),
          date: new Date(date).toISOString(),
          description: description.trim(),
          photoUrl,
        },
      });
      setMemoryId(res.data.createMemory.id);
      setActiveStep(2);
    } catch (err) {
      setDetailsError('Error creating memory: ' + err.message);
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
      setPhotoResult(null);
      setTitle('');
      setDate('');
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
          <FileUpload
            onFileSelect={handleFileSelect}
          />
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
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              aria-label="Title"
              required
              style={{ padding: 12, borderRadius: 4, border: '1px solid #ccc', fontSize: 16 }}
            />
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              aria-label="Date"
              required
              style={{ padding: 12, borderRadius: 4, border: '1px solid #ccc', fontSize: 16 }}
            />
            <textarea
              placeholder="Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              aria-label="Description"
              required
              rows={3}
              style={{ padding: 12, borderRadius: 4, border: '1px solid #ccc', fontSize: 16 }}
            />
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
