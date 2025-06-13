"use client";

import React, { useState } from 'react';
import { Box, Button, Stepper, Step, StepLabel, Typography, Paper, TextField, Alert, CircularProgress } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import FileUpload from '../components/FileUpload';
import PersonSelection from '../components/PersonSelection';
import { useMutation, gql } from '@apollo/client';
import type { Person } from '../components/PersonSelection';
import { useRouter } from 'next/navigation';

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

interface MemoryDetails {
  title: string;
  date: Dayjs | null;
  description: string;
}

const OnboardingStepUpload: React.FC<{
  image: File | null;
  setImage: (file: File | null) => void;
  onNext: () => void;
  error: string;
  loading: boolean;
}> = ({ image, setImage, onNext, error, loading }) => (
  <Box>
    <Typography variant="h5" gutterBottom>Welcome! Let&apos;s get started by adding a photo.</Typography>
    <Typography variant="body1" sx={{ mb: 2 }}>Upload an image to begin your first memory. Photos make your memories vivid and meaningful.</Typography>
    <FileUpload onFileSelect={setImage} />
    {image && (
      <Box mt={2} textAlign="center">
        <img src={URL.createObjectURL(image)} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }} />
      </Box>
    )}
    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    <Button variant="contained" sx={{ mt: 3 }} onClick={onNext} disabled={!image || loading}>
      {loading ? <CircularProgress size={20} /> : 'Next'}
    </Button>
  </Box>
);

const OnboardingStepDetails: React.FC<{
  image: File | null;
  details: MemoryDetails;
  setDetails: (details: MemoryDetails) => void;
  onBack: () => void;
  onNext: () => void;
  error: string;
  loading: boolean;
}> = ({ image, details, setDetails, onBack, onNext, error, loading }) => (
  <Box>
    <Typography variant="h5" gutterBottom>Tell us about your memory</Typography>
    <Typography variant="body1" sx={{ mb: 2 }}>Give your memory a title, date, and description. This helps you relive the moment later.</Typography>
    {image && (
      <Box mb={2} textAlign="center">
        <img src={URL.createObjectURL(image)} alt="Preview" style={{ maxWidth: '100%', maxHeight: 120, borderRadius: 8 }} />
      </Box>
    )}
    <TextField
      label="Title"
      value={details.title}
      onChange={e => setDetails({ ...details, title: e.target.value })}
      fullWidth
      required
      sx={{ mb: 2 }}
      inputProps={{ maxLength: 80 }}
    />
    <DatePicker
      label="Date"
      value={details.date}
      onChange={date => setDetails({ ...details, date })}
      slotProps={{ textField: { required: true, fullWidth: true, size: 'medium' } }}
      format="DD/MM/YYYY"
    />
    <TextField
      label="Description"
      value={details.description}
      onChange={e => setDetails({ ...details, description: e.target.value })}
      fullWidth
      required
      multiline
      minRows={3}
      sx={{ mt: 2 }}
      inputProps={{ maxLength: 500 }}
    />
    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
      <Button variant="outlined" onClick={onBack}>Back</Button>
      <Button variant="contained" onClick={onNext} disabled={!(details.title && details.date && details.description) || loading}>
        {loading ? <CircularProgress size={20} /> : 'Next'}
      </Button>
    </Box>
  </Box>
);

const OnboardingStepPeople: React.FC<{
  people: Person[];
  setPeople: (people: Person[]) => void;
  onBack: () => void;
  onSubmit: () => void;
  error: string;
  loading: boolean;
}> = ({ people, setPeople, onBack, onSubmit, error, loading }) => (
  <Box>
    <Typography variant="h5" gutterBottom>Who was there?</Typography>
    <Typography variant="body1" sx={{ mb: 2 }}>Tag people who were part of this memory. You can add as many as you like.</Typography>
    <PersonSelection value={people} onChange={setPeople} />
    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
      <Button variant="outlined" onClick={onBack}>Back</Button>
      <Button variant="contained" onClick={onSubmit} disabled={people.length === 0 || loading}>
        {loading ? <CircularProgress size={20} /> : 'Create Memory'}
      </Button>
    </Box>
  </Box>
);

export default function OnboardingMemoryFlow() {
  const [step, setStep] = useState(0);
  const [image, setImage] = useState<File | null>(null);
  const [details, setDetails] = useState<MemoryDetails>({ title: '', date: dayjs(), description: '' });
  const [people, setPeople] = useState<Person[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [memoryId, setMemoryId] = useState<string | null>(null);

  const [createMemory] = useMutation(CREATE_MEMORY);
  const [addPeople] = useMutation(ADD_PEOPLE);
  const router = useRouter();

  const handleNext = async () => {
    setError('');
    if (step === 0) {
      if (!image) {
        setError('Please upload an image.');
        return;
      }
      setStep(1);
    } else if (step === 1) {
      if (!details.title || !details.date || !details.description) {
        setError('Please fill in all fields.');
        return;
      }
      setLoading(true);
      try {
        // Upload image
        const formData = new FormData();
        if (image) {
          formData.append('photo', image);
        }
        const res = await fetch('/api/photos/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (!res.ok || !data.folder || !data.baseFilename) {
          setError(data.error || 'Photo upload failed.');
          setLoading(false);
          return;
        }
        const photoUrl = `/api/photos/${data.folder}/${data.baseFilename}`;
        // Create memory
        const gqlRes = await createMemory({
          variables: {
            title: details.title.trim(),
            date: details.date ? details.date.toISOString() : dayjs().toISOString(),
            description: details.description.trim(),
            photoUrl,
          },
        });
        setMemoryId(gqlRes.data.createMemory.id);
        setStep(2);
      } catch (err: unknown) {
        setError('Error creating memory: ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    setError('');
    setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    setError('');
    if (!people.length || !memoryId) {
      setError('Please tag at least one person.');
      return;
    }
    setLoading(true);
    try {
      await addPeople({
        variables: {
          memoryId,
          input: {
            peopleIds: people.map((p: Person) => p.id),
          },
        },
      });
      // Redirect to memory detail page
      router.push(`/memory/${memoryId}`);
      // Optionally reset state if user comes back
      setStep(0);
      setImage(null);
      setDetails({ title: '', date: null, description: '' });
      setPeople([]);
      setMemoryId(null);
      setError('');
    } catch (err: unknown) {
      setError('Error tagging people: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ maxWidth: 520, mx: 'auto', mt: 6, p: 4 }}>
      <Stepper activeStep={step} alternativeLabel sx={{ mb: 4 }}>
        <Step><StepLabel>Upload Image</StepLabel></Step>
        <Step><StepLabel>Memory Details</StepLabel></Step>
        <Step><StepLabel>Tag People</StepLabel></Step>
      </Stepper>
      {step === 0 && <OnboardingStepUpload image={image} setImage={setImage} onNext={handleNext} error={error} loading={loading} />}
      {step === 1 && <OnboardingStepDetails image={image} details={details} setDetails={setDetails} onBack={handleBack} onNext={handleNext} error={error} loading={loading} />}
      {step === 2 && <OnboardingStepPeople people={people} setPeople={setPeople} onBack={handleBack} onSubmit={handleSubmit} error={error} loading={loading} />}
    </Paper>
  );
} 