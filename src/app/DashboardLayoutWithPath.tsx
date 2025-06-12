'use client';
import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import DashboardLayoutComponent from '../components/DashboardLayout';

export default function DashboardLayoutWithPath({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const router = useRouter();

  // Pass a navigate function that uses Next.js router
  const navigate = React.useCallback((path: string | URL) => {
    const url = typeof path === 'string' ? path : path.toString();
    if (!url.startsWith('/')) {
      router.push('/' + url);
    } else {
      router.push(url);
    }
  }, [router]);

  return <DashboardLayoutComponent pathname={pathname} navigate={navigate}>{children}</DashboardLayoutComponent>;
} 