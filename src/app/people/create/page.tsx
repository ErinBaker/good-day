"use client";
import React from "react";
import { useRouter } from "next/navigation";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import PersonCreationForm from "../../components/PersonCreationForm.js";

export default function CreatePersonPage() {
  const router = useRouter();

  const handlePersonCreated = () => {
    router.push("/people");
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Create Person
      </Typography>
      <PersonCreationForm onCreated={handlePersonCreated} />
    </Container>
  );
} 