"use client";
import React from "react";
import { useParams } from "next/navigation";
import { useQuery, gql } from "@apollo/client";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import PersonPhotoMasonry from '../../components/PersonPhotoMasonry';

const PERSON_MEMORIES_QUERY = gql`
  query PersonMemories($id: ID!) {
    person(id: $id) {
      id
      name
      relationship
    }
    memories(peopleIds: [$id], limit: 100, sortBy: "date") {
      items {
        id
        photoUrl
        title
      }
    }
  }
`;

export default function PersonDetailPage() {
  const params = useParams();
  const id = params && typeof params.id !== 'undefined' ? (Array.isArray(params.id) ? params.id[0] : params.id) : '';
  const { data, loading, error } = useQuery(PERSON_MEMORIES_QUERY, { variables: { id } });
  const person = data?.person;
  const memories = data?.memories?.items || [];

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', py: 4, px: { xs: 1, sm: 2 } }}>
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Alert severity="error">Error loading person: {error.message}</Alert>
      )}
      {person && (
        <>
          <Typography variant="h3" sx={{ mb: 1, fontWeight: 700 }}>{person.name}</Typography>
          {person.relationship && (
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>{person.relationship}</Typography>
          )}
          {/* Photo masonry grid placeholder */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              Memories with {person.name}:
            </Typography>
            <Box>
              {memories.length === 0 ? (
                <Typography color="text.secondary">No memories found for this person.</Typography>
              ) : (
                <PersonPhotoMasonry memories={memories} />
              )}
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
} 