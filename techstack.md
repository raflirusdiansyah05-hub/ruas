# techstack.md — RUAS

> Baca `prd.md` dan `design.md` terlebih dahulu. File ini adalah batasan teknis WAJIB, mencakup arsitektur, stack, skema database, API, dan mekanisme integrasi AI. Untuk aturan kerja AI coding agent saat mengeksekusi ini, lihat `agent.md`.

---

## 📌 Changelog Update Terbaru (Round 3 — hosting balik ke Render)

Hugging Face **mengubah kebijakan**: SDK Docker & Gradio sekarang butuh paid plan (hanya SDK Static yang tetap gratis) — dikonfirmasi langsung dari dashboard huggingface.co saat ini. Karena itu, hosting ML service **dikembalikan ke Render** (opsi Round 1, masih benar-benar gratis di 2026: tanpa kartu kredit, 512MB RAM, cold start 30–60 detik saat idle). Bagian yang berubah:

- **Bagian 1 & 2.1** — Hosting ML Service kembali jadi **Render** (bukan Hugging Face Spaces).
- **Bagian 2.5** — `AI_REMOTE_ENDPOINT` contoh URL kembali ke format `https://<nama>.onrender.com`.
- **Bagian 3.1** — Langkah 6b kembali menyebut Render.
- **Bagian 4.5** — `Dockerfile` ditulis ulang pakai `$PORT` (env var dinamis dari Render), **BUKAN** port fixed 7860 (itu aturan khusus Hugging Face yang sudah tidak dipakai). File `README.md` metadata YAML (khusus HF) **dihapus**, tidak diperlukan di Render. Langkah deploy ditulis ulang total mengikuti alur Render (New → Web Service → connect repo → Render auto-detect `Dockerfile`). CORS middleware & endpoint health check `GET /` di `app.py` **tetap dipertahankan** (berguna di platform apa pun, bukan spesifik HF).

---

## 📌 Changelog Round 2 (riwayat — sudah digantikan sebagian oleh Round 3 di atas)

Round ini sempat mengganti hosting ke Hugging Face Spaces dan model ke `yolo26n.pt`. **Keputusan model TETAP** `yolo26n.pt` (YOLO26) — hanya keputusan hostingnya yang dibalik lagi ke Render di Round 3.

- **Model AI diganti dari YOLOv8 → `yolo26n.pt` (YOLO26, varian nano)** — seluruh rujukan nama model di Bagian 1, 2.1, 4.3, 4.5 diperbarui. (Keputusan ini tetap berlaku.)
- ~~Hosting ML Service diganti ke Hugging Face Spaces~~ — **dibatalkan di Round 3**, lihat di atas.
- **Bagian 4.5 — `app.py` (📌 nama file berubah dari `main.py`):** tambah **CORS middleware** (WAJIB agar domain Vercel bisa memanggil), tambah **endpoint health check `GET /`**. (Tetap berlaku di Render.)

---

## 📌 Changelog Update Round 1 (riwayat — sudah termasuk di atas)

Round ini mencakup finalisasi formula Severity/Priority dan aktivasi integrasi FastAPI (sebelumnya dua hal ini masih rencana/placeholder). Bagian yang berubah:

- **Bagian 1** — Poin 4: ML Service ditandai **AKTIF**, bukan lagi rencana.
- **Bagian 2.1** — Baris ML Service & Hosting ML Service ditandai AKTIF; tambah baris **sharp** (resize AI).
- **Bagian 2.3** — Tabel `reports`: tambah kolom `fungsi_jalan`. Tabel `priority_scores`: kolom lama (`severity_level`, `confidence_component`, `density_component`) diganti `s_norm` & `exposure_value` sesuai formula baru.
- **Bagian 2.4** — Baris `GET /api/reports`: query param diperbarui (`fungsi_jalan` ganti `severity`, tambah opsi `sort`).
- **Bagian 2.5** — `AI_REMOTE_ENDPOINT` & `AI_PROVIDER`: catatan penggunaan hosting ML diperjelas.
- **Bagian 3.1** — Langkah 8–9 diperbarui mengikuti nama variabel formula baru (`S_norm`, `exposure_value`).
- **Bagian 4.3** — **DITULIS ULANG TOTAL**: formula final Severity (bobot per `damage_type`) → `S_norm` (normalisasi P95) → Exposure dari Fungsi Jalan → Priority `0.70·S_norm + 0.30·E`. Komponen waktu (T) dihapus total dari formula; staleness/aging jadi indikator UI-only on-the-fly (kode `hari_menunggu` disertakan).
- **Bagian 4.4** — Tambah catatan resize 640×640 khusus untuk AI (terpisah dari kompresi penyimpanan).
- **Bagian 4.5** — **DITULIS ULANG**: Remote Provider sekarang AKTIF (bukan "disiapkan"), termasuk kode `remote-provider.ts` lengkap (resize via `sharp` + kirim ke FastAPI), diagram komunikasi Vercel ⇄ ML Service, skeleton FastAPI (`ultralytics` YOLO), dan langkah deploy (termasuk catatan cold-start).

---

## 1. Overview & Architectural Philosophy

RUAS dibangun dengan pendekatan **Jamstack/serverless full-stack** menggunakan satu framework (Next.js) untuk frontend dan backend sekaligus — **bukan** arsitektur microservices penuh, kecuali untuk komponen ML yang secara sengaja dipisah.

**Alasan pemilihan pendekatan ini:**
1. **Kesederhanaan untuk tim kecil/AI agent tunggal** — satu bahasa (TypeScript) di seluruh aplikasi utama mengurangi context-switching dan risiko error saat AI coding agent bekerja.
2. **Backend-as-a-Service (Supabase)** menghilangkan kebutuhan membangun server auth/database/storage dari nol — mengurangi permukaan kode yang rawan bug keamanan (auth, RLS sudah teruji).
3. **Deploy tanpa manajemen infrastruktur** — Vercel + Supabase keduanya serverless, auto-scaling, cocok untuk tahap MVP/prototype tanpa tim DevOps.
4. **Pengecualian sengaja — ML Service terpisah:** model deteksi kerusakan jalan (YOLO26, sudah dilatih — `yolo26n.pt`) TIDAK dijalankan di Next.js/Vercel karena kebutuhan komputasi berat & waktu eksekusi yang tidak cocok dengan model serverless function biasa. Model ini berjalan sebagai **microservice Python (FastAPI) terpisah, deploy di Render**, dihubungkan lewat HTTP — lihat Bagian 4.5 (status: **AKTIF**, bukan lagi rencana masa depan).

Pola arsitektur: **Monolith modular** (satu codebase Next.js, dipecah rapi lewat folder route groups per role) + **satu microservice eksternal** (ML, opsional/belum aktif).

---

## 2. Tech Stack Specification

### 2.1 Bahasa & Framework

| Layer | Pilihan | Fungsi |
|---|---|---|
| Framework utama | **Next.js 14+ (App Router)**, TypeScript | Frontend + backend (Route Handlers) dalam satu aplikasi |
| Styling | **Tailwind CSS** + **shadcn/ui** | Implementasi seluruh token desain di `design.md`; komponen accessible siap pakai |
| Database | **Supabase (PostgreSQL)** | Penyimpanan data relasional utama |
| Auth | **Supabase Auth** (via `@supabase/ssr`) | Registrasi, login, OTP email, invite user, session management |
| Storage | **Supabase Storage** | Penyimpanan foto laporan & bukti perbaikan |
| Query/Client DB | **`@supabase/supabase-js`** langsung (TANPA ORM tambahan seperti Prisma) | Mengurangi layer; type-safety lewat `supabase gen types typescript` |
| Form & Validasi | **React Hook Form** + **Zod** | Validasi schema-based, terintegrasi TypeScript |
| Peta | **Leaflet** + **react-leaflet**, tile **OpenStreetMap** | Gratis, tanpa API key |
| Reverse Geocoding | **Nominatim (OpenStreetMap)** API, dipanggil dari server route | Menghindari rate-limit di sisi client |
| Icon | **lucide-react** | Konsisten dengan shadcn/ui, sesuai `design.md` Bagian 6 |
| Kompresi Gambar (upload) | **browser-image-compression** | Kompresi client-side sebelum upload ke Supabase Storage |
| Resize Gambar (AI, 📌 baru) | **sharp** (server-side, dalam route handler `/api/ai/detect`) | Resize foto ke 640×640 sebelum dikirim ke FastAPI — lihat Bagian 4.4 & 4.5 |
| Grafik/Chart | **Recharts** | Dashboard admin & analitik |
| ML Service (**AKTIF**) | **Python 3.11 + FastAPI**, repo terpisah dari repo Next.js, menjalankan model **YOLO26 (`yolo26n.pt`)** yang sudah dilatih tim | Endpoint `/deteksi` menerima foto, mengembalikan deteksi kerusakan jalan |
| Hosting Frontend+Backend | **Vercel**, deploy dari GitHub (auto CI/CD tiap push ke `main`) | — |
| Hosting ML Service (**AKTIF**) | **Render** (Web Service, dari repo FastAPI terpisah) | Vercel serverless tidak cocok untuk inference model berat; Render jalankan container Python terus-menerus |

### 2.2 Struktur Direktori (WAJIB Diikuti)

```
ruas/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                  # Landing page
│   │   ├── login/page.tsx
│   │   ├── sign-up/page.tsx
│   │   ├── verify-otp/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   ├── set-password/page.tsx     # Aktivasi akun Petugas (dari link undangan)
│   │   ├── privacy-policy/page.tsx
│   │   └── terms/page.tsx
│   │
│   ├── (pelapor)/
│   │   ├── layout.tsx
│   │   ├── pelapor/page.tsx
│   │   ├── pelapor/lapor/page.tsx
│   │   ├── pelapor/lapor/hasil/[id]/page.tsx
│   │   ├── pelapor/riwayat/page.tsx
│   │   ├── pelapor/riwayat/[id]/page.tsx
│   │   └── pelapor/profil/page.tsx
│   │
│   ├── (admin)/
│   │   ├── layout.tsx
│   │   ├── admin/page.tsx
│   │   ├── admin/queue/page.tsx
│   │   ├── admin/queue/[id]/page.tsx
│   │   ├── admin/petugas/page.tsx
│   │   ├── admin/analitik/page.tsx
│   │   └── admin/pengaturan/page.tsx
│   │
│   ├── (petugas)/
│   │   ├── layout.tsx
│   │   ├── petugas/page.tsx
│   │   ├── petugas/tugas/[id]/page.tsx
│   │   ├── petugas/riwayat/page.tsx
│   │   └── petugas/profil/page.tsx
│   │
│   ├── api/
│   │   ├── auth/verify-nip/route.ts
│   │   ├── reports/route.ts
│   │   ├── reports/[id]/route.ts
│   │   ├── reports/[id]/verify/route.ts
│   │   ├── reports/[id]/assign/route.ts
│   │   ├── assignments/[id]/status/route.ts
│   │   ├── ai/detect/route.ts
│   │   ├── analytics/summary/route.ts
│   │   ├── notifications/route.ts
│   │   └── petugas/invite/route.ts
│   │
│   ├── layout.tsx
│   ├── globals.css
│   └── middleware.ts
│
├── components/
│   ├── ui/                            # shadcn/ui primitives
│   ├── shared/                        # PriorityBadge, StalenessBadge, StatusBadge, EmptyState, BottomNav, AdminSidebar
│   ├── forms/                         # PhotoUploader, LocationPicker
│   └── maps/                          # MapView, MapPin (Leaflet wrapper)
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── ai/
│   │   ├── types.ts
│   │   ├── mock-provider.ts
│   │   ├── remote-provider.ts
│   │   └── index.ts                   # Factory/provider selector
│   ├── scoring/
│   │   ├── severity.ts
│   │   └── priority.ts
│   ├── validations/
│   └── utils.ts
│
├── types/
│   └── database.ts                    # Generated types dari Supabase CLI
│
├── supabase/
│   ├── migrations/
│   └── seed.sql
│
├── public/
│   └── images/
│       ├── ruas-logo.png
│       └── ruas-mascot.png
│
├── .env.local.example
├── tailwind.config.ts
├── next.config.js
├── package.json
└── README.md
```

### 2.3 Skema Database (PostgreSQL via Supabase)

Jalankan sebagai migration berurutan di `supabase/migrations/`.

```sql
-- 0001_profiles.sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('pelapor', 'admin', 'petugas')),
  full_name text not null,
  phone text,
  nip text,
  instansi text,
  wilayah text,
  status text not null default 'active' check (status in ('active', 'pending', 'suspended')),
  created_at timestamptz not null default now()
);

-- 0002_instansi_referensi.sql
-- Data seed/simulasi untuk verifikasi NIP+Instansi (BUKAN integrasi real ke SIMPEG/BKN)
create table public.instansi_referensi (
  id uuid primary key default gen_random_uuid(),
  nip text unique not null,
  nama_pegawai text not null,
  instansi text not null,
  is_active boolean not null default true
);

-- 0003_reports.sql
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  photo_url text not null,
  latitude numeric(10,7) not null,
  longitude numeric(10,7) not null,
  address_text text,
  description text,
  fungsi_jalan text not null
    check (fungsi_jalan in ('arteri','kolektor','lokal','lingkungan')),
  status text not null default 'baru'
    check (status in ('baru','diverifikasi','dijadwalkan','dikerjakan','selesai','ditolak')),
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_reports_status on public.reports(status);
create index idx_reports_reporter on public.reports(reporter_id);

-- 0004_detections.sql
create table public.detections (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  damage_type text not null
    check (damage_type in ('retak_memanjang','retak_melintang','retak_buaya','lubang')),
  confidence numeric(4,3) not null,
  bbox_x numeric not null,
  bbox_y numeric not null,
  bbox_w numeric not null,
  bbox_h numeric not null,
  model_version text not null default 'mock-v0',
  created_at timestamptz not null default now()
);
create index idx_detections_report on public.detections(report_id);

-- 0005_priority_scores.sql
-- Lihat techstack.md Bagian 4.3 untuk definisi lengkap tiap kolom.
create table public.priority_scores (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null unique references public.reports(id) on delete cascade,
  severity_value numeric not null,       -- raw, unbounded, Σ(damage_weight * confidence * area_ratio)
  s_norm numeric not null check (s_norm >= 0 and s_norm <= 100),   -- severity_value dinormalisasi via P95 cap
  exposure_value numeric not null check (exposure_value in (25, 50, 75, 100)), -- dari fungsi_jalan
  priority_value numeric not null check (priority_value >= 0 and priority_value <= 100), -- 0.70*s_norm + 0.30*exposure_value
  computed_at timestamptz not null default now()
);
create index idx_priority_value on public.priority_scores(priority_value desc);

-- 0006_assignments.sql
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  petugas_id uuid not null references public.profiles(id),
  assigned_by uuid not null references public.profiles(id),
  assigned_at timestamptz not null default now(),
  status text not null default 'ditugaskan'
    check (status in ('ditugaskan','dikerjakan','selesai')),
  proof_photo_url text,
  completed_at timestamptz
);
create index idx_assignments_petugas on public.assignments(petugas_id);

-- 0007_status_history.sql
create table public.status_history (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  status_from text,
  status_to text not null,
  changed_by uuid not null references public.profiles(id),
  changed_at timestamptz not null default now(),
  note text
);

-- 0008_notifications.sql
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  related_report_id uuid references public.reports(id),
  created_at timestamptz not null default now()
);
create index idx_notifications_user on public.notifications(user_id, is_read);
```

**Row-Level Security (RLS) — WAJIB diaktifkan di semua tabel.** Contoh pola inti (terapkan pola serupa ke seluruh tabel lain, disesuaikan kepemilikan/role):

```sql
alter table public.reports enable row level security;

create policy "pelapor_select_own_reports"
  on public.reports for select
  using (auth.uid() = reporter_id);

create policy "pelapor_insert_own_reports"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

create policy "staff_select_all_reports"
  on public.reports for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'petugas')
    )
  );

create policy "admin_update_reports"
  on public.reports for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );
```

**Storage:** 2 bucket — `reports` (foto laporan, public read, insert oleh user login) dan `proofs` (foto bukti perbaikan, public read, insert hanya oleh petugas yang di-assign).

### 2.4 Daftar API Routes

| Method | Endpoint | Role Akses | Deskripsi |
|---|---|---|---|
| POST | `/api/auth/verify-nip` | Public | Cek NIP+Instansi terhadap `instansi_referensi` |
| POST | `/api/reports` | pelapor | Buat laporan baru |
| GET | `/api/reports` | pelapor (own), admin (all) | List laporan, query param `status`/`fungsi_jalan`/`wilayah`/`sort` (`priority_value.desc` default, atau `created_at.asc` untuk mode "Terlama Menunggu") |
| GET | `/api/reports/[id]` | pelapor (own), admin, petugas (assigned) | Detail laporan + detections + priority_score + history |
| PATCH | `/api/reports/[id]/verify` | admin | `{ action: 'verify' \| 'reject', reason?: string }` |
| PATCH | `/api/reports/[id]/assign` | admin | `{ petugas_id: string }` |
| PATCH | `/api/assignments/[id]/status` | petugas | `{ status: 'dikerjakan' \| 'selesai', proof_photo_url?: string }` |
| POST | `/api/ai/detect` | internal | Lihat Bagian 4.5 |
| GET | `/api/analytics/summary` | admin | Statistik agregat |
| GET / PATCH | `/api/notifications` | semua role | List & tandai dibaca |
| POST | `/api/petugas/invite` | admin | Undang akun petugas baru |

### 2.5 Environment Variables Setup

File `.env.local` (development) dan disetel juga di dashboard Vercel untuk production:

```
NEXT_PUBLIC_SUPABASE_URL=              # URL project Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=         # Public anon key, aman di-expose ke client
SUPABASE_SERVICE_ROLE_KEY=             # SANGAT RAHASIA — hanya dipakai di server-side (route handler), untuk invite user & bypass RLS saat perlu
AI_PROVIDER=mock                        # 'mock' | 'remote' — lihat Bagian 4.5. Gunakan 'mock' di .env.local (dev), 'remote' di Vercel (staging/production)
AI_REMOTE_ENDPOINT=                     # 📌 URL FastAPI di Render, mis. https://ruas-ai.onrender.com (WAJIB diisi di Vercel saat AI_PROVIDER=remote)
NEXT_PUBLIC_SITE_URL=                   # URL production untuk redirect OTP/invite (mis. https://ruas.vercel.app)
NEXT_PUBLIC_ENABLE_DEV_SHORTCUTS=false  # Panel "Akses Cepat Demo 3 Role" di halaman Login — HANYA 'true' di .env.local, JANGAN PERNAH diset di Vercel (Production/Preview). Lihat design.md Bagian 8.4.
```

**Aturan wajib:** `SUPABASE_SERVICE_ROLE_KEY` tidak boleh pernah muncul di kode yang berjalan di client (tidak boleh diawali `NEXT_PUBLIC_`, tidak boleh diimpor dari Client Component). `NEXT_PUBLIC_ENABLE_DEV_SHORTCUTS` juga tidak boleh diset di dashboard Vercel untuk environment mana pun — kelalaian di sini akan membocorkan kredensial demo ke publik.

---

## 3. Detailed Program Flow Diagram

Diagram berikut menunjukkan pergerakan data teknis dari client hingga kembali lagi, untuk 3 alur inti sistem.

### 3.1 Alur Pelapor Membuat Laporan

```
[Browser Pelapor]
   │  1. Kompres foto (browser-image-compression)
   │  2. Upload foto ke Supabase Storage (bucket: reports)
   ▼
[Next.js Route Handler: POST /api/reports]
   │  3. Validasi input (Zod)
   │  4. Simpan baris baru di tabel `reports` (status: 'baru')
   │  5. Panggil getDetectionProvider().detectDamage(photoUrl)
   ▼
[lib/ai — Mock atau Remote Provider]
   │  6a. (Mock, dev lokal) generate hasil deteksi acak terkontrol
   │  6b. (Remote, 📌 AKTIF) resize foto 640x640 (sharp) → POST ke FastAPI ML Service di Render
   ▼
[Next.js Route Handler — lanjutan]
   │  7. Simpan hasil ke tabel `detections`
   │  8. Hitung severity_value & S_norm (lib/scoring/severity.ts)
   │  9. Hitung exposure_value dari `fungsi_jalan` + priority_value final (lib/scoring/priority.ts)
   │ 10. Simpan ke tabel `priority_scores`
   │ 11. Catat `status_history` (null → 'baru')
   │ 12. Buat notifikasi in-app untuk Admin jika severity tinggi/critical
   ▼
[Browser Pelapor] ← Response JSON (report + detections + priority_score)
   │ 13. Redirect ke Halaman Hasil Deteksi
```

### 3.2 Alur Admin Verifikasi & Assign

```
[Browser Admin] → GET /api/reports?sort=priority_value.desc
   ▼
[Supabase — RLS memfilter otomatis by role admin: lihat semua]
   ▼
[Browser Admin] ← Queue laporan terurut
   │
   │ Admin buka detail → PATCH /api/reports/[id]/verify { action: 'verify' }
   ▼
[Route Handler] → update `reports.status`, insert `status_history`, buat notifikasi ke Pelapor
   │
   │ Admin assign → PATCH /api/reports/[id]/assign { petugas_id }
   ▼
[Route Handler] → insert `assignments`, update `reports.status` = 'dijadwalkan',
                   insert `status_history`, buat notifikasi ke Petugas
```

### 3.3 Alur Petugas Menyelesaikan Tugas

```
[Browser Petugas] → PATCH /api/assignments/[id]/status { status: 'dikerjakan' }
   ▼
[Route Handler] → update `assignments.status`, update `reports.status` = 'dikerjakan', insert `status_history`

[Browser Petugas] → Upload foto bukti ke Storage (bucket: proofs)
   │
   ▼
[Browser Petugas] → PATCH /api/assignments/[id]/status { status: 'selesai', proof_photo_url }
   ▼
[Route Handler] → update `assignments` (proof_photo_url, completed_at),
                   update `reports.status` = 'selesai', insert `status_history`,
                   buat notifikasi ke Pelapor
```

---

## 4. Program Execution Breakdown

### 4.1 Pola Wajib Setiap Route Handler

```
1. Ambil session user via Supabase server client (lib/supabase/server.ts)
2. Validasi input dengan Zod schema (lib/validations/)
3. Cek otorisasi (role user sesuai kebutuhan endpoint — RLS sebagai lapisan kedua)
4. Jalankan logic (query Supabase / lib/scoring / lib/ai)
5. Catat ke status_history jika ada perubahan status laporan
6. Kembalikan response JSON konsisten: { data: ... } atau { error: { message, code } }
```

### 4.2 Alur Autentikasi — Detail per Role

**Pelapor:**
```ts
supabase.auth.signUp({
  email, password,
  options: { data: { role: 'pelapor', full_name } }
})
// Trigger DB `on_auth_user_created` otomatis insert ke profiles
// Supabase Auth kirim OTP email otomatis (aktifkan "Confirm email")
// Verifikasi: supabase.auth.verifyOtp({ email, token, type: 'signup' })
```

**Admin:** sebelum `signUp`, frontend memanggil `POST /api/auth/verify-nip` dengan `{ nip, instansi }`. Endpoint query `instansi_referensi`; jika tidak ditemukan/`is_active=false` → tolak, JANGAN lanjut `signUp`. Jika cocok → lanjutkan `signUp` dengan metadata role `admin` + nip + instansi, lalu proses OTP sama seperti Pelapor.

**Petugas — alur invite lengkap (TIDAK melalui `signUp` publik):**
1. Admin isi form (`Nama`, `Email`, `Wilayah`) di halaman Manajemen Petugas → `POST /api/petugas/invite`.
2. Endpoint (server-side, pakai `SUPABASE_SERVICE_ROLE_KEY`) memanggil:
   ```ts
   await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
     data: { role: 'petugas', full_name, wilayah },
     redirectTo: `${SITE_URL}/set-password`,
   });
   ```
3. Trigger `on_auth_user_created` otomatis insert ke `profiles` dengan `status='pending'`.
4. Petugas klik link email → sesi sementara terbaca otomatis oleh `@supabase/ssr` di halaman `/set-password`.
5. Halaman tersebut memanggil `supabase.auth.updateUser({ password })` → update `profiles.status = 'active'`.
6. Redirect ke `/petugas` — user sudah dalam kondisi login.

**Middleware (`middleware.ts`):** baca session dari cookie, ambil `role` dari `profiles`, cocokkan dengan segment route (`(pelapor)`, `(admin)`, `(petugas)`). Halaman `/set-password` dikecualikan dari proteksi role biasa (cukup butuh sesi undangan valid).

### 4.3 Severity & Priority Scoring Engine (FINAL — hasil diskusi tim)

Modul ini harus terpisah dan bisa diaudit (`lib/scoring/`) — bukan black box, karena Admin harus bisa melihat breakdown-nya secara transparan (lihat `prd.md` Bagian 5.4 dan `design.md` Bagian 2). Skor dihitung **sekali, di backend Next.js, saat laporan dibuat** — bukan di dalam model AI (model hanya mengembalikan deteksi mentah via `lib/ai`, lihat Bagian 4.5), dan bukan di-recompute ulang oleh cron job.

**Keputusan final arsitektur (jangan diubah tanpa diskusi ulang):**
1. Komponen waktu (urgency temporal) **DIHAPUS total dari formula matematis** — tidak ada lagi variabel `T` apa pun. Kekhawatiran "laporan lama jangan sampai terkubur" ditangani di luar formula, sebagai **indikator staleness/aging on-the-fly di UI** (lihat poin 5), bukan komponen skor.
2. Badge warna yang dilihat Admin (Queue & Detail Laporan) berdasarkan **Priority Score**, BUKAN Severity. Severity hanya komponen input, tidak punya badge sendiri — lihat `design.md` Bagian 3.2 & 6.
3. Bobot final Priority: **S_norm 0.70 : Exposure 0.30** (dibulatkan bersih, dipilih dibanding alternatif proporsional 0.72:0.28).

**Input dari hasil deteksi (per laporan, bisa lebih dari satu deteksi per foto):**
- `damage_type` — salah satu dari 4 jenis kerusakan
- `confidence` — 0.0–1.0
- `bbox` (x, y, width, height) → dipakai menghitung `area_ratio` = luas bbox relatif terhadap luas frame foto
- `fungsi_jalan` — diisi Pelapor saat Form Lapor (lihat `design.md` Bagian 8.3): `arteri` | `kolektor` | `lokal` | `lingkungan`

**Langkah 1 — Severity (raw, per laporan):**

Bobot per jenis kerusakan (`damage_weight`):

| `damage_type` | Bobot |
|---|---|
| `lubang` | `1.00` |
| `retak_buaya` | `0.80` |
| `retak_melintang` | `0.40` |
| `retak_memanjang` | `0.40` |

```
severity_value = Σ (damage_weight[detection.damage_type] * detection.confidence * detection.area_ratio)
                 untuk semua detection dalam 1 laporan
```

Hasil ini **tidak dibatasi (unbounded)** — makin banyak/luas kerusakan, makin tinggi nilainya. Disimpan mentah (`severity_value`) sebagai bagian breakdown transparan.

**Langkah 2 — Normalisasi Severity → `S_norm` (0–100):**

```
S_norm = min(severity_value / P95_severity, 1) * 100
```

`P95_severity` adalah nilai persentil-95 dari seluruh `severity_value` yang sudah terkumpul di database (dikonfigurasi sebagai konstanta yang di-update berkala, bukan dihitung ulang live per request — lihat catatan kalibrasi di bawah). Nilai di atas P95 di-cap jadi 100 (tidak ada skor "di atas maksimum").

> **Catatan kalibrasi:** `P95_severity` butuh data deteksi asli (dari AI Provider, mock ataupun remote) untuk dihitung dengan baik. Di awal pengembangan (saat `AI_PROVIDER=mock`), gunakan nilai default masuk akal berdasarkan distribusi output Mock Provider, lalu recalibrate konstanta ini setelah cukup data laporan asli terkumpul (manual, bukan otomatis/cron).

**Langkah 3 — Exposure (`E`, 0–100) dari Fungsi Jalan:**

| `fungsi_jalan` | `E` |
|---|---|
| `arteri` | `100` |
| `kolektor` | `75` |
| `lokal` | `50` |
| `lingkungan` | `25` |

**Langkah 4 — Priority Score final (0–100):**

```
priority_value = (0.70 * S_norm) + (0.30 * E)
```

Bobot `0.70` dan `0.30` disimpan sebagai konstanta yang bisa dikonfigurasi di satu tempat (`lib/scoring/weights.ts`) — JANGAN hardcode berulang di banyak file. **JANGAN** memakai formula lama `Severity × Urgency × Impact` atau `w1*severity + w2*confidence + w3*density` — sudah digantikan sepenuhnya oleh formula di atas.

**Langkah 5 — Staleness/Aging indicator (UI-only, TIDAK bagian dari formula, TIDAK disimpan di DB):**

Dihitung on-the-fly setiap kali daftar laporan di-render di server (route handler `/api/reports` atau Server Component halaman Queue), dari `reports.created_at` — bukan kolom baru, bukan cron job:

```ts
const reportsWithAge = reports.map((report) => {
  const createdAt = new Date(report.created_at);
  const now = new Date();
  const hariMenunggu = Math.floor(
    (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  return {
    ...report,
    hari_menunggu: hariMenunggu,
    is_stale: hariMenunggu >= 7 && !["selesai", "ditolak"].includes(report.status),
  };
});
```

Hasil `is_stale` dipakai `StalenessBadge` ("⚠ Menunggu X hari") di `design.md` Bagian 6. Admin tetap bisa sort Queue Laporan berdasarkan `created_at` (toggle "Terlama Menunggu", lihat `design.md` Bagian 8.3) sebagai cara terpisah untuk memastikan laporan lama tidak terlupakan, tanpa mencampurnya ke formula `priority_value`.

### 4.4 Alur Storage & Kompresi Foto

1. User pilih/ambil foto di client.
2. `browser-image-compression` mengompres ke target maksimal ~1MB sebelum upload (lihat `prd.md` Bagian 6 — Non-Functional Requirements: Performa).
3. Upload langsung ke Supabase Storage dari client (memakai `NEXT_PUBLIC_SUPABASE_ANON_KEY`, dibatasi RLS storage policy).
4. URL publik hasil upload dikirim ke route handler (`POST /api/reports` atau endpoint assignment) — **bukan** file mentah yang dikirim ke server Next.js, untuk menghindari beban payload besar di serverless function.

> **📌 BARU — Resize khusus untuk AI, terpisah dari kompresi penyimpanan:** foto yang disimpan di Supabase Storage (langkah 1–3 di atas) TETAP memakai target ukuran ~1MB agar tampilan galeri/detail tetap bagus. TAPI foto yang dikirim ke FastAPI (Bagian 4.5) harus **di-resize terlebih dahulu ke 640×640px** (dimensi input standar YOLO26), dan file hasil resize ini harus dijaga tetap kecil (target di bawah ~300KB) sebelum dikirim lewat `fetch`. Resize ke 640×640 dilakukan di server (route handler `/api/ai/detect`, menggunakan `sharp`), **bukan** di browser — supaya satu sumber kebenaran untuk ukuran yang dikirim ke model, terlepas dari device/browser Pelapor. Lihat detail di Bagian 4.5.

### 4.5 AI Provider Abstraction (Mock ↔ Real Model) — WAJIB Dipahami Sebelum Implementasi

> **📌 BARU — status terbaru:** model YOLO26 tim (`yolo26n.pt`) sudah dilatih dan **Remote Provider sekarang AKTIF**, bukan lagi rencana masa depan. Pola abstraksi Mock/Remote di bawah **tetap dipertahankan** (jangan dihapus) — Mock Provider masih dipakai untuk development/testing lokal tanpa bergantung ke Render (hemat biaya, hindari cold-start saat ngoding fitur yang tidak terkait AI), sementara Remote Provider dipakai di staging/production.

Interface kontrak berikut memastikan migrasi antara Mock ⇄ Real model **tidak memerlukan perubahan kode di luar `lib/ai/`**.

```typescript
// lib/ai/types.ts
export type DamageType = "retak_memanjang" | "retak_melintang" | "retak_buaya" | "lubang";

export interface DetectionResult {
  damage_type: DamageType;
  confidence: number;
  bbox: { x: number; y: number; width: number; height: number };
}

export interface DetectionResponse {
  detections: DetectionResult[];
  model_version: string;
  processing_time_ms: number;
}

export interface DetectionProvider {
  detectDamage(imageUrl: string): Promise<DetectionResponse>;
}
```

**Mock Provider (AKTIF sekarang)** — `lib/ai/mock-provider.ts` — menghasilkan deteksi acak terkontrol (bukan selalu sama), dengan bias sedikit lebih sering ke "lubang" berconfidence tinggi agar jalur severity `critical` mudah diuji saat demo. Simulasikan latency ~800ms agar UI loading state teruji secara realistis.

**Remote Provider (📌 AKTIF)** — `lib/ai/remote-provider.ts` — memanggil endpoint FastAPI eksternal (hosted di Render, 📌 Round 3 — lihat catatan di atas) via `fetch`, mapping response ke bentuk `DetectionResponse` yang sama persis:

```typescript
// lib/ai/remote-provider.ts
import sharp from "sharp";

export class RemoteDetectionProvider implements DetectionProvider {
  constructor(private endpoint: string) {}

  async detectDamage(imageUrl: string): Promise<DetectionResponse> {
    // 1. Ambil foto asli dari Supabase Storage, resize ke 640x640 (input standar YOLO26)
    const originalRes = await fetch(imageUrl);
    const originalBuffer = Buffer.from(await originalRes.arrayBuffer());
    const resizedBuffer = await sharp(originalBuffer)
      .resize(640, 640, { fit: "contain", background: { r: 255, g: 255, b: 255 } })
      .jpeg({ quality: 80 }) // jaga ukuran kecil (~target di bawah 300KB)
      .toBuffer();

    // 2. Kirim ke FastAPI via multipart/form-data
    const form = new FormData();
    form.append("file", new Blob([resizedBuffer], { type: "image/jpeg" }), "detect.jpg");

    const response = await fetch(`${this.endpoint}/deteksi`, {
      method: "POST",
      body: form,
    });
    if (!response.ok) throw new Error(`FastAPI error: ${response.status}`);

    // 3. Mapping response FastAPI -> bentuk DetectionResponse (kontrak internal)
    const raw = await response.json();
    return {
      detections: raw.detections.map((d: any) => ({
        damage_type: d.class_name,
        confidence: d.confidence,
        bbox: { x: d.x, y: d.y, width: d.w, height: d.h },
      })),
      model_version: raw.model_version ?? "yolo26n-v1",
      processing_time_ms: raw.processing_time_ms ?? 0,
    };
  }
}
```

**Arsitektur komunikasi (penting untuk dipahami agent):** Frontend+backend Next.js (Vercel) dan ML Service (FastAPI, Render) adalah **dua deployment yang sepenuhnya terpisah**, saling bicara murni lewat HTTP publik:

```
[Browser Pelapor]
   │  upload foto → Supabase Storage
   ▼
[Vercel — Next.js Route Handler: POST /api/ai/detect]
   │  getDetectionProvider() → RemoteDetectionProvider
   │  resize foto ke 640x640 (sharp)
   │  fetch POST → https://<nama-service-anda>.onrender.com/deteksi
   ▼
[Render — FastAPI Service (yolo26n.pt / YOLO26)]
   │  jalankan inference, kembalikan JSON deteksi
   ▼
[Vercel] ← mapping ke DetectionResponse → lanjut Bagian 4.3 (Scoring Engine)
```

**Contoh skeleton FastAPI service** (repo terpisah dari Next.js, bukan bagian dari `apps/web`), nama file **WAJIB** `app.py` agar cocok dengan `Dockerfile` di bawah:

```python
# app.py
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from PIL import Image
import io, time

app = FastAPI()

# 📌 BARU — WAJIB: izinkan domain Vercel memanggil service ini (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # produksi: ganti "*" dengan domain Vercel spesifik, mis. "https://ruas.vercel.app"
    allow_methods=["*"],
    allow_headers=["*"],
)

model = YOLO("yolo26n.pt")

# 📌 BARU — health check, dipakai untuk cek service hidup tanpa harus kirim foto
@app.get("/")
def health():
    return {"status": "ok"}

@app.post("/deteksi")
async def deteksi(file: UploadFile = File(...)):
    start = time.time()
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    results = model.predict(image, imgsz=640)
    detections = []
    for box in results[0].boxes:
        x, y, w, h = box.xywhn[0].tolist()  # normalized 0-1, relatif ke frame (dipakai sbg area_ratio di Bagian 4.3)
        detections.append({
            "class_name": model.names[int(box.cls[0])],
            "confidence": float(box.conf[0]),
            "x": x, "y": y, "w": w, "h": h,
        })

    return {
        "detections": detections,
        "model_version": "yolo26n-v1",
        "processing_time_ms": int((time.time() - start) * 1000),
    }
```

`requirements.txt` minimal: `fastapi`, `uvicorn[standard]`, `ultralytics`, `python-multipart`, `pillow`.

> **📌 Dockerfile (Round 3 — dipakai untuk Render, PORT dinamis via env var, BUKAN port fixed seperti HF Spaces):**
> ```dockerfile
> FROM python:3.11-slim
> WORKDIR /app
> COPY requirements.txt .
> RUN pip install --no-cache-dir -r requirements.txt
> COPY . .
> CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port $PORT"]
> ```
> Render **inject environment variable `$PORT` otomatis** saat container jalan — jangan hardcode port tertentu di `CMD`, karena nilainya ditentukan Render saat runtime (biasanya `10000`, tapi jangan diasumsikan tetap).

**Langkah deploy ke Render (📌 Round 3 — kembali dipakai, menggantikan alur Hugging Face Spaces karena HF sekarang mewajibkan paid plan untuk SDK Docker):**
1. Siapkan repo terpisah (beda dari repo Next.js) berisi `app.py`, `yolo26n.pt`, `requirements.txt`, `Dockerfile`, push ke GitHub.
2. Buat akun di render.com (tidak perlu kartu kredit untuk tier gratis).
3. Dashboard Render → **New** → **Web Service** → connect repo GitHub tersebut.
4. Render otomatis mendeteksi `Dockerfile` dan pakai itu untuk build & run — pastikan "Environment" di pengaturan Service terset ke **Docker** (biasanya otomatis).
5. Pilih instance type **Free** (512MB RAM — cukup untuk model nano seperti `yolo26n.pt`, tapi jaga agar tidak ada proses lain yang makan memori berlebih).
6. Setelah deploy selesai, catat URL publik yang diberikan Render, mis. `https://ruas-ai.onrender.com` — tes dulu via `https://<url>/` (health check) dan `https://<url>/docs` (Swagger UI) sebelum disambungkan ke Vercel.
7. **Penting:** tier gratis Render "sleep" setelah ~15 menit idle → request pertama setelah idle bisa lambat (cold start 30–60 detik). Beri loading state yang jelas di UI Hasil Deteksi (lihat `design.md` Bagian 7 — skeleton loading) agar Pelapor tidak mengira aplikasi error. Kalau butuh performa stabil tanpa sleep, baru perlu upgrade ke paid instance Render.

**Factory/selector** — `lib/ai/index.ts`:
```typescript
export function getDetectionProvider(): DetectionProvider {
  const providerType = process.env.AI_PROVIDER ?? "mock";
  if (providerType === "remote") {
    const endpoint = process.env.AI_REMOTE_ENDPOINT;
    if (!endpoint) throw new Error("AI_REMOTE_ENDPOINT belum diisi saat AI_PROVIDER=remote");
    return new RemoteDetectionProvider(endpoint);
  }
  return new MockDetectionProvider();
}
```

Route handler (`/api/reports`, `/api/ai/detect`) **hanya** boleh memanggil `getDetectionProvider().detectDamage(imageUrl)` — tidak boleh tahu detail implementasi mock/remote.

**Checklist aktivasi Remote Provider (📌 status saat ini — bukan lagi "nanti"):**
1. ✅ Deploy service FastAPI ke Render, catat URL publiknya (`https://<nama-service-anda>.onrender.com`).
2. ✅ Response JSON FastAPI mengikuti bentuk yang di-mapping `remote-provider.ts` ke `DetectionResponse` (lihat kode di atas) — `types.ts` TIDAK berubah.
3. Set environment variable di Vercel: `AI_PROVIDER=remote`, `AI_REMOTE_ENDPOINT=https://<nama-service-anda>.onrender.com`.
4. Redeploy Vercel — tidak perlu mengubah kode di luar `lib/ai/remote-provider.ts` jika bentuk response sudah sesuai.
5. Uji ulang alur Form Lapor → Hasil Deteksi → Severity/Priority → Queue Admin, termasuk uji cold-start Render (lihat poin 5 langkah deploy di atas).
6. `model_version` yang tersimpan di database membedakan laporan lama (mock) vs baru (model asli YOLO26) untuk keperluan evaluasi/proposal kompetisi.
7. Development lokal tetap boleh pakai `AI_PROVIDER=mock` di `.env.local` agar tidak selalu memanggil Render saat ngoding fitur non-AI.
