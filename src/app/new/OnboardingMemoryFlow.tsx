"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Box, Button, Stepper, Step, StepLabel, Typography, Paper, TextField, Alert, CircularProgress, Fade, Backdrop } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import PersonSelection from '../components/PersonSelection';
import { useMutation, gql } from '@apollo/client';
import type { Person } from '../components/PersonSelection';
import { useRouter } from 'next/navigation';
import exifr from 'exifr';
import { EditorContent, useEditor, BubbleMenu, FloatingMenu, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import './OnboardingMemoryFlow.tiptap.css';

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
  location?: { lat: string; lng: string };
}

const OnboardingStepUpload: React.FC<{
  onImageSelected: (file: File) => void;
  error: string;
  loading: boolean;
}> = ({ onImageSelected, error, loading }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // Handle file selection (click or drop)
  const handleFile = useCallback((file: File | null) => {
    if (!file) return;
    onImageSelected(file);
  }, [onImageSelected]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  };
  const handleClick = () => {
    inputRef.current?.click();
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    handleFile(file);
  };

  return (
    <Box
      sx={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: dragOver ? 'primary.lighter' : 'background.default',
        border: dragOver ? '3px solid' : '3px dashed',
        borderColor: dragOver ? 'primary.main' : 'grey.300',
        borderRadius: 4,
        transition: 'border 0.2s, background 0.2s',
        cursor: 'pointer',
        position: 'relative',
        width: '100%',
        p: { xs: 2, md: 6 },
        outline: 'none',
      }}
      tabIndex={0}
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      aria-label="Upload a photo by clicking or dragging anywhere on this area"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={handleChange}
        aria-label="Choose image file"
      />
      <Box sx={{ textAlign: 'center', width: '100%' }}>
        <Typography variant="h4" gutterBottom>Bring a Memory to Life</Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
        Drop a photo anywhere, or click to choose one.<br/>
        Every picture tells a story — start yours now.
        </Typography>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {loading && <CircularProgress sx={{ mt: 2 }} />}
      </Box>
    </Box>
  );
};

const OnboardingStepDetails: React.FC<{
  image: File | null;
  details: MemoryDetails;
  setDetails: (details: MemoryDetails) => void;
  onBack: () => void;
  onNext: () => void;
  error: string;
  loading: boolean;
}> = ({ image, details, setDetails, onBack, onNext, error, loading }) => {
  // Ensure description is always a string before passing to useEditor
  const safeDetails = { ...details, description: typeof details.description === 'string' ? details.description : '' };
  const editor = useEditor({
    extensions: [StarterKit],
    content: safeDetails.description,
    onUpdate: ({ editor }: { editor: Editor }) => {
      setDetails({ ...details, description: String(editor.getHTML()) });
    },
    editorProps: {
      attributes: {
        'aria-label': 'Description',
        'tabIndex': 0,
        'role': 'textbox',
        'style': 'min-height:120px; outline:none; font-size:1rem; padding:12px; border-radius:4px; border:1px solid #ccc; background:#fff;',
      },
    },
  });

  return (
    <Box sx={{ width: '100%', minHeight: { xs: 400, md: 500 }, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 0 } }}>
      {/* Left: Image Preview */}
      <Box sx={{ width: { xs: '100%', md: '50%' }, minWidth: 0, height: { xs: 240, md: 400 }, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100', borderRadius: 2, overflow: 'hidden' }}>
        {image && (
          <img src={URL.createObjectURL(image)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, maxHeight: 400, maxWidth: '100%' }} />
        )}
      </Box>
      {/* Right: Form */}
      <Box sx={{ width: { xs: '100%', md: '50%' }, minWidth: 0, p: { xs: 1, md: 4 }, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Typography variant="h5" gutterBottom>What makes this memory special?</Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>Add a title, a date, a short description, and (if available) a location.</Typography>
        <TextField
          label="Title"
          value={details.title}
          onChange={e => setDetails({ ...details, title: e.target.value })}
          fullWidth
          placeholder="e.g. 'My First Concert'"
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
        <Box sx={{ mt: 2, mb: 1 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Description</Typography>
          <Box sx={{ position: 'relative', minHeight: 120 }}>
            {editor && (
              <>
                <BubbleMenu className="bubble-menu" tippyOptions={{ duration: 100 }} editor={editor}>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={editor.isActive('bold') ? 'is-active' : ''}
                    aria-label="Bold"
                  >
                    <FormatBoldIcon fontSize="small" />
                  </button>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={editor.isActive('italic') ? 'is-active' : ''}
                    aria-label="Italic"
                  >
                    <FormatItalicIcon fontSize="small" />
                  </button>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={editor.isActive('strike') ? 'is-active' : ''}
                    aria-label="Strike"
                  >
                    <s>S</s>
                  </button>
                </BubbleMenu>
              </>
            )}
            {editor && (
              <FloatingMenu className="floating-menu" tippyOptions={{ duration: 100 }} editor={editor}>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                  className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
                  aria-label="Heading 1"
                >
                  H1
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                  className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
                  aria-label="Heading 2"
                >
                  H2
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  className={editor.isActive('bulletList') ? 'is-active' : ''}
                  aria-label="Bullet list"
                >
                  <FormatListBulletedIcon fontSize="small" />
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  className={editor.isActive('orderedList') ? 'is-active' : ''}
                  aria-label="Numbered list"
                >
                  <FormatListNumberedIcon fontSize="small" />
                </button>
              </FloatingMenu>
            )}
            <EditorContent editor={editor} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <TextField
            label="Latitude"
            value={details.location?.lat ?? ''}
            onChange={e => setDetails({ ...details, location: { lat: e.target.value, lng: details.location?.lng ?? '' } })}
            fullWidth
            type="number"
            inputProps={{ step: 'any', min: -90, max: 90 }}
            placeholder="Latitude"
          />
          <TextField
            label="Longitude"
            value={details.location?.lng ?? ''}
            onChange={e => setDetails({ ...details, location: { lat: details.location?.lat ?? '', lng: e.target.value } })}
            fullWidth
            type="number"
            inputProps={{ step: 'any', min: -180, max: 180 }}
            placeholder="Longitude"
          />
        </Box>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button variant="outlined" onClick={onBack}>Back</Button>
          <Button variant="contained" onClick={onNext} disabled={!(details.title && details.date && details.description) || loading}>
            {loading ? <CircularProgress size={20} /> : 'Next'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

const OnboardingStepPeople: React.FC<{
  image: File | null;
  people: Person[];
  setPeople: (people: Person[]) => void;
  onBack: () => void;
  onSubmit: () => void;
  error: string;
  loading: boolean;
}> = ({ image, people, setPeople, onBack, onSubmit, error, loading }) => (
  <Box sx={{ width: '100%', minHeight: { xs: 400, md: 500 }, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 0 } }}>
    {/* Left: Image Preview */}
    <Box sx={{ width: { xs: '100%', md: '50%' }, minWidth: 0, height: { xs: 240, md: 400 }, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100', borderRadius: 2, overflow: 'hidden' }}>
      {image && (
        <img src={URL.createObjectURL(image)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, maxHeight: 400, maxWidth: '100%' }} />
      )}
    </Box>
    {/* Right: People Tagging Form */}
    <Box sx={{ width: { xs: '100%', md: '50%' }, minWidth: 0, p: { xs: 1, md: 4 }, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <Typography variant="h5" gutterBottom>Who shared this moment with you?</Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>Tag the people who were there — friends, family, anyone who made it memorable.</Typography>
      <PersonSelection value={people} onChange={setPeople} />
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button variant="outlined" onClick={onBack}>Back</Button>
        <Button variant="contained" onClick={onSubmit} disabled={people.length === 0 || loading}>
          {loading ? <CircularProgress size={20} /> : 'Create Memory'}
        </Button>
      </Box>
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
  const [transitioning, setTransitioning] = useState(false);

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
      // Type guard: ensure description is a string
      if (typeof details.description !== 'string') {
        details.description = String(details.description ?? '');
      }
      // Validate location if present
      if ((details.location?.lat && isNaN(Number(details.location.lat))) || (details.location?.lng && isNaN(Number(details.location.lng)))) {
        setError('Latitude and longitude must be numbers.');
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
            description: String(details.description).trim(),
            photoUrl,
            location: details.location?.lat && details.location?.lng ? { lat: parseFloat(details.location.lat), lng: parseFloat(details.location.lng) } : null,
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
      // Show transition overlay before redirect
      setTransitioning(true);
      setTimeout(() => {
        router.push(`/memory/${memoryId}`);
        // Do NOT reset state here to avoid flashing the empty form
        // setStep(0);
        // setImage(null);
        // setDetails({ title: '', date: null, description: '' });
        // setPeople([]);
        // setMemoryId(null);
        // setError('');
        // setTransitioning(false);
      }, 1000);
    } catch (err: unknown) {
      setError('Error tagging people: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  // New handler for image selection that sets image and advances step
  const handleImageSelected = async (file: File) => {
    setImage(file);
    setError('');
    // Try to extract EXIF metadata
    try {
      const exif = await exifr.parse(file, { gps: true });
      const newDetails = { ...details };
      if (exif?.DateTimeOriginal || exif?.CreateDate) {
        newDetails.date = dayjs(exif.DateTimeOriginal || exif.CreateDate);
      }
      if (exif?.latitude && exif?.longitude) {
        newDetails.location = { lat: exif.latitude.toString(), lng: exif.longitude.toString() };
      } else {
        newDetails.location = { lat: '', lng: '' };
      }
      // Ensure description is always a string
      if (typeof newDetails.description !== 'string') {
        newDetails.description = String(newDetails.description ?? '');
      }
      setDetails(newDetails);
    } catch {
      // Ignore EXIF errors
    }
    setStep(1);
  };

  return (
    <Box sx={{ position: 'relative' }}>
      {transitioning ? (
        <Fade in={transitioning} timeout={400} unmountOnExit>
          <Backdrop open sx={{ zIndex: (theme) => theme.zIndex.drawer + 2, color: '#fff', flexDirection: 'column' }}>
            <CircularProgress color="inherit" sx={{ mb: 3 }} />
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>Creating your memory...</Typography>
            <Typography variant="body1">Hang tight! We&apos;re saving your special moment.</Typography>
          </Backdrop>
        </Fade>
      ) : (
        <Paper sx={{ mx: 'auto', mt: 2, p: 4, transition: 'opacity 0.4s' }}>
          <Stepper activeStep={step} alternativeLabel sx={{ mb: 4 }}>
            <Step><StepLabel>Share a photo</StepLabel></Step>
            <Step><StepLabel>Memory Details</StepLabel></Step>
            <Step><StepLabel>Tag People</StepLabel></Step>
          </Stepper>
          {step === 0 && <OnboardingStepUpload onImageSelected={handleImageSelected} error={error} loading={loading} />}
          {step === 1 && <OnboardingStepDetails image={image} details={details} setDetails={setDetails} onBack={handleBack} onNext={handleNext} error={error} loading={loading} />}
          {step === 2 && <OnboardingStepPeople image={image} people={people} setPeople={setPeople} onBack={handleBack} onSubmit={handleSubmit} error={error} loading={loading} />}
        </Paper>
      )}
    </Box>
  );
} 