# Sistem Akademik Web

**Frontend Next.js** untuk [Sistem Akademik API](https://github.com/rizky-916/sistem-akademik-api): aplikasi web untuk mengelola data mahasiswa, dosen, mata kuliah, dosen pengampu, dan pendaftaran mata kuliah (KRS).

Proyek ini awalnya dikerjakan sebagai bagian dari tugas UTS mata kuliah PBKK, lalu difinalisasi untuk portofolio dengan fokus pada keamanan sesi login dan keandalan aplikasi.

---

## Fitur

- **Login** dengan token Sanctum, termasuk pesan khusus saat percobaan login dibatasi server.
- **Dashboard** ringkasan jumlah mata kuliah, mahasiswa, dan dosen (diperbarui otomatis tiap 30 detik).
- **CRUD lengkap**: mahasiswa, dosen, mata kuliah, dosen pengampu, dan pendaftaran (KRS) dengan nilai serta kehadiran.
- **Tambah akun pengguna** (`/register`), hanya untuk pengguna yang sudah login.
- **Proteksi halaman**: semua halaman dashboard otomatis mengalihkan ke `/login` jika belum login atau token sudah kedaluwarsa.
- **Logout aman**: token dicabut di server, bukan hanya dihapus dari browser.

## Teknologi

- [Next.js 15](https://nextjs.org/) (App Router) + React 19 + TypeScript
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Axios](https://axios-http.com/) dengan klien API terpusat
- [React Icons](https://react-icons.github.io/react-icons/)

## Struktur Proyek

```
src/
├── app/
│   ├── page.tsx                 # Mengarahkan ke /dashboard atau /login
│   ├── login/page.tsx           # Halaman login
│   ├── register/page.tsx        # Tambah akun (wajib login)
│   └── dashboard/
│       ├── page.tsx             # Ringkasan
│       ├── students/            # Mahasiswa
│       ├── lecturers/           # Dosen
│       ├── courses/             # Mata kuliah
│       ├── courseslecturers/    # Dosen pengampu
│       └── enrollment/          # Pendaftaran (KRS)
└── lib/
    ├── api.ts                   # Klien axios: base URL, token, penanganan 401
    ├── auth.ts                  # Proteksi halaman & logout
    └── session.ts               # Penyimpanan sesi + cek kedaluwarsa token
```

## Menjalankan Secara Lokal

**Prasyarat:** Node.js 18.18+ dan [Sistem Akademik API](https://github.com/rizky-916/sistem-akademik-api) yang sudah berjalan di `http://127.0.0.1:8000`.

```bash
git clone https://github.com/rizky-916/sistem-akademik-web.git
cd sistem-akademik-web

npm install
cp .env.example .env.local      # Windows CMD: copy .env.example .env.local
npm run dev
```

Buka **`http://localhost:3000`**, lalu login dengan akun admin dari seeder API.

> Buka lewat `localhost:3000` (bukan `127.0.0.1:3000`), karena origin inilah yang diizinkan oleh pengaturan CORS di API (`CORS_ALLOWED_ORIGINS`).

### Konfigurasi

| Variabel | Default | Keterangan |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://127.0.0.1:8000/api` | Alamat Sistem Akademik API |

### Build produksi

```bash
npm run build
npm start
```

## Keamanan

- **Header keamanan** di semua halaman: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, serta **Content-Security-Policy** saat produksi yang membatasi koneksi hanya ke aplikasi ini dan alamat API.
- **Token kedaluwarsa** dicek di browser; respons `401` dari API otomatis menghapus sesi dan mengarahkan ke `/login`.
- **Logout** mencabut token di server (`POST /api/logout`).
- Data pengguna yang disimpan di browser dibatasi pada nama, username, email, dan ID.
- Dependensi diperbarui ke versi yang sudah menambal celah keamanan yang diketahui (Next.js, React, axios).
- File `.env*` tidak ikut di-commit, kecuali `.env.example`.

> Catatan: token disimpan di `localStorage`, praktik umum untuk SPA dengan bearer token. Untuk keamanan lebih tinggi, aplikasi dapat dimigrasikan ke autentikasi cookie *httpOnly* bawaan Sanctum (SPA authentication).

## Lisensi

Dirilis di bawah [Lisensi MIT](LICENSE).

---

Dibuat oleh **Rizky Maulana Hafis** — S1 Teknik Informatika, Universitas Muhammadiyah Pontianak.
