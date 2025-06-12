"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, gql } from "@apollo/client";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import FileUpload from "../../../components/FileUpload";
import PersonSelection from "../../../components/PersonSelection";
import type { SyntheticEvent } from "react";

const MEMORY_DETAIL_QUERY = gql`
  query Memory($id: ID!) {
    memory(id: $id) {
      id
      title
      date
      description
      photoUrl
      people { id name relationship }
      photos { id originalFilename folder baseFilename mimeType size width height createdAt }
    }
  }
`;

const UPDATE_MEMORY_MUTATION = gql`
  mutation UpdateMemory($id: ID!, $input: MemoryUpdateInput!) {
    updateMemory(id: $id, input: $input) {
      id
      title
      date
      description
      photoUrl
      people { id name relationship }
      photos { id originalFilename folder baseFilename mimeType size width height createdAt }
    }
  }
`;

// Person type for selection
interface Person {
  id: string;
  name: string;
  relationship?: string;
}

export default function EditMemoryPage() {
  const params = useParams();
  const router = useRouter();
  const id = params && typeof params.id !== 'undefined' ? (Array.isArray(params.id) ? params.id[0] : params.id) : '';
  const { data, loading, error } = useQuery(MEMORY_DETAIL_QUERY, { variables: { id } });
  const memory = data?.memory;

  // Form state
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPeople, setSelectedPeople] = useState<Person[]>([]);
  const [photoUrl, setPhotoUrl] = useState("");
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState<string>("");
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ message: string; severity: 'success' | 'error' | 'info' | 'warning'; open: boolean }>({ message: '', severity: 'success', open: false });

  useEffect(() => {
    if (memory) {
      setTitle(memory.title || "");
      setDate(memory.date ? memory.date.slice(0, 10) : "");
      setDescription(memory.description || "");
      setSelectedPeople(memory.people || []);
      setPhotoUrl(memory.photoUrl || "");
      setOriginalPhotoUrl(memory.photoUrl || "");
      setPhotoRemoved(false);
    }
  }, [memory]);

  const [updateMemory] = useMutation(UPDATE_MEMORY_MUTATION);

  const handleFileSelect = async (result: unknown) => {
    if (
      result &&
      typeof result === 'object' &&
      'folder' in result &&
      'baseFilename' in result &&
      typeof (result as { folder: unknown }).folder === 'string' &&
      typeof (result as { baseFilename: unknown }).baseFilename === 'string'
    ) {
      setPhotoUrl(`/api/photos/${(result as { folder: string }).folder}/${(result as { baseFilename: string }).baseFilename}`);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUrl("");
    setPhotoRemoved(true);
  };

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    setDetailsError("");
    if (!title.trim() || !date || !description.trim()) {
      setDetailsError("All fields are required.");
      return;
    }
    setSaving(true);
    try {
      const input = {
        title: title.trim(),
        date: new Date(date).toISOString(),
        description: description.trim(),
        photoUrl,
        peopleIds: selectedPeople.map((p: Person) => p.id),
      };
      await updateMemory({ variables: { id, input } });
      setAlert({ message: 'Memory updated successfully!', severity: 'success', open: true });
      setTimeout(() => router.push(`/memory/${id}`), 1200);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? (err as { message?: string }).message : String(err);
      setDetailsError('Error updating memory: ' + msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">Error loading memory: {error.message}</Alert>;
  if (!memory) return <Alert severity="warning">Memory not found.</Alert>;

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', py: 4, px: { xs: 1, sm: 2 } }}>
      <Typography variant="h4" component="h1" gutterBottom>Edit Memory</Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Photo Preview and Remove Button */}
        {photoUrl ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <img src={photoUrl} alt="Current" style={{ maxWidth: 120, borderRadius: 8, border: '1px solid #ccc' }} />
            <Button variant="outlined" color="error" onClick={handleRemovePhoto} disabled={saving}>
              Remove Photo
            </Button>
          </Box>
        ) : (
          <Alert severity="warning">You must upload a new photo before saving.</Alert>
        )}
        <FileUpload onFileSelect={handleFileSelect} />
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
        <PersonSelection value={selectedPeople} onChange={setSelectedPeople} />
        {detailsError && <Alert severity="error">{detailsError}</Alert>}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button type="submit" variant="contained" color="primary" disabled={saving || !photoUrl}>
            {saving ? <CircularProgress size={18} /> : 'Save Changes'}
          </Button>
          <Button variant="outlined" color="secondary" onClick={() => router.push(`/memory/${id}`)} disabled={saving}>
            Cancel
          </Button>
        </Box>
      </Box>
      {alert.open && <Alert severity={alert.severity} sx={{ mt: 2 }}>{alert.message}</Alert>}
    </Box>
  );
} 