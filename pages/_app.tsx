import { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Check for authentication on protected routes
  useEffect(() => {
    const publicRoutes = ['/', '/login', '/register'];
    const pathname = router.pathname;
    
    if (!publicRoutes.includes(pathname)) {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
      }
    }
  }, [router.pathname, router]);

  return (
    <AuthProvider>
      <ThemeProvider>
        <Component {...pageProps} />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--toaster-bg)',
              color: 'var(--toaster-color)',
            },
          }}
        />
      </ThemeProvider>
    </AuthProvider>
  );
}