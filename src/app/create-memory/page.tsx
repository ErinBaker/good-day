"use client";
import React from "react";
import { useRouter } from "next/navigation";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import MemoryEntryForm from "../components/MemoryEntryForm";

export default function CreateMemoryPage() {
  const router = useRouter();

  const handleMemoryCreated = () => {
    router.push("/");
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Create Memory
      </Typography>
      <MemoryEntryForm onMemoryCreated={handleMemoryCreated} />
    </Container>
  );
} 