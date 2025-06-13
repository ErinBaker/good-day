'use client';
import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import DashboardLayoutComponent from '../components/DashboardLayout';
import { Backdrop, Fade, CircularProgress, Typography } from '@mui/material';

export default function DashboardLayoutWithPath({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const [transitioning, setTransitioning] = React.useState(false);
  const lastPath = React.useRef(pathname);

  React.useEffect(() => {
    // When the pathname changes, hide the overlay
    if (transitioning && pathname !== lastPath.current) {
      setTransitioning(false);
      lastPath.current = pathname;
    }
  }, [pathname, transitioning]);

  // Patch router.push to show overlay on navigation
  const navigate = React.useCallback((path: string | URL) => {
    const url = typeof path === 'string' ? path : path.toString();
    if (url !== pathname) {
      setTransitioning(true);
    }
    if (!url.startsWith('/')) {
      router.push('/' + url);
    } else {
      router.push(url);
    }
  }, [router, pathname]);

  return (
    <>
      <DashboardLayoutComponent pathname={pathname} navigate={navigate}>{children}</DashboardLayoutComponent>
      <Fade in={transitioning} timeout={400} unmountOnExit>
        <Backdrop open sx={{ zIndex: (theme) => theme.zIndex.drawer + 2, color: '#fff', flexDirection: 'column' }}>
          <CircularProgress color="inherit" sx={{ mb: 3 }} />
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>Loading...</Typography>
        </Backdrop>
      </Fade>
    </>
  );
} 