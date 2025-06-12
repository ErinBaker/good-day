import * as React from 'react';
import Box from '@mui/material/Box';
import { AppProvider } from '@toolpad/core/AppProvider';
import { DashboardLayout, SidebarFooterProps } from '@toolpad/core/DashboardLayout';
import { createTheme } from '@mui/material/styles';
import { NAVIGATION } from './navigation';

// Placeholder for account sidebar/footer (can be expanded later)
function SidebarFooterAccount({ mini }: SidebarFooterProps) {
  return null;
}

const dashboardTheme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'data-toolpad-color-scheme',
  },
  colorSchemes: { light: true, dark: true },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
});

interface DashboardLayoutProps {
  children: React.ReactNode;
  pathname: string;
  navigate?: (path: string) => void;
}

export default function DashboardLayoutComponent({ children, pathname, navigate }: DashboardLayoutProps) {
  // Use the provided navigate function if available
  const router = React.useMemo(() => ({
    pathname,
    searchParams: new URLSearchParams(),
    navigate: navigate || (() => {}),
  }), [pathname, navigate]);

  return (
    <AppProvider navigation={NAVIGATION} router={router} theme={dashboardTheme}>
      <DashboardLayout slots={{ sidebarFooter: SidebarFooterAccount }}>
        <Box sx={{ p: 3, width: '100%' }}>{children}</Box>
      </DashboardLayout>
    </AppProvider>
  );
} 