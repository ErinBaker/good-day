"use client";
import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Link from 'next/link';

const NavBar: React.FC = () => {
  return (
    <AppBar position="static" color="default" elevation={2} sx={{ mb: 3 }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" component={Link} href="/" sx={{ textDecoration: 'none', color: 'inherit', fontWeight: 700 }}>
            Good Day App
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            component={Link}
            href="/new"
            variant="contained"
            color="primary"
            sx={{ fontWeight: 600 }}
          >
            Create Memory
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar; 