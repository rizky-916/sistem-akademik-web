/**
 * Penyimpanan sesi login di browser.
 * Kunci 'auth_token' dan 'user' dipertahankan agar kompatibel dengan versi sebelumnya.
 */
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user';
const EXPIRES_KEY = 'auth_expires_at';

export interface SessionUser {
  id?: string;
  name: string;
  username?: string;
  email?: string;
}

function storage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function saveSession(token: string, user: SessionUser | null, expiresAt?: string | null): void {
  const s = storage();
  if (!s) return;
  s.setItem(TOKEN_KEY, token);
  if (user) {
    // Simpan hanya data yang dibutuhkan tampilan, bukan seluruh objek dari API
    const { id, name, username, email } = user;
    s.setItem(USER_KEY, JSON.stringify({ id, name, username, email }));
  }
  if (expiresAt) s.setItem(EXPIRES_KEY, expiresAt);
  else s.removeItem(EXPIRES_KEY);
}

export function clearSession(): void {
  const s = storage();
  if (!s) return;
  s.removeItem(TOKEN_KEY);
  s.removeItem(USER_KEY);
  s.removeItem(EXPIRES_KEY);
}

/** Token yang masih berlaku, atau null jika tidak ada / sudah kedaluwarsa. */
export function getToken(): string | null {
  const s = storage();
  if (!s) return null;
  const token = s.getItem(TOKEN_KEY);
  if (!token) return null;

  const expiresAt = s.getItem(EXPIRES_KEY);
  if (expiresAt) {
    const time = Date.parse(expiresAt);
    if (!Number.isNaN(time) && time <= Date.now()) {
      clearSession();
      return null;
    }
  }
  return token;
}

export function getUser(): SessionUser | null {
  const s = storage();
  if (!s) return null;
  try {
    const raw = s.getItem(USER_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed.name === 'string' ? parsed : null;
  } catch {
    return null;
  }
}
