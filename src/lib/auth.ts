'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from './api';
import { clearSession, getToken } from './session';

/**
 * Melindungi halaman yang wajib login.
 * Mengembalikan true setelah token valid ditemukan; jika tidak ada atau
 * sudah kedaluwarsa, pengguna diarahkan ke /login.
 */
export function useAuthGuard(): boolean {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (getToken()) {
      setReady(true);
    } else {
      router.replace('/login');
    }
  }, [router]);

  return ready;
}

/** Logout: cabut token di server, lalu hapus sesi lokal dan kembali ke /login. */
export async function logout(): Promise<void> {
  try {
    if (getToken()) {
      await api.post('/logout');
    }
  } catch {
    // Tetap lanjutkan logout lokal meskipun server tidak bisa dihubungi
  } finally {
    clearSession();
    if (typeof window !== 'undefined') {
      window.location.replace('/login');
    }
  }
}
