import { createTheme } from '@mui/material/styles';

const sunFadedRetroTheme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#FAD6A5', // Soft Peach
      paper: '#FFF8F0',   // Optional lighter variation
    },
    primary: {
      main: '#E8A87C', // Goldenrod
      contrastText: '#2F2F2F',
    },
    secondary: {
      main: '#A8D0DB', // Dusty Teal
      contrastText: '#2F2F2F',
    },
    error: {
      main: '#F76C6C', // Muted Coral
    },
    text: {
      primary: '#2F2F2F', // Charcoal
      secondary: '#555555',
    },
    divider: '#DADADA',
  },
  typography: {
    fontFamily: `'Roboto', 'Helvetica', 'Arial', sans-serif`,
    h1: {
      fontWeight: 600,
    },
    h2: {
      fontWeight: 500,
    },
    h3: {
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
    },
    body2: {
      fontSize: '0.9rem',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        },
      },
    },
  },
});

export default sunFadedRetroTheme; 