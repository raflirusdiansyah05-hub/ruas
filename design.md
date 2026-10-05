# design.md — RUAS

> Baca `prd.md` terlebih dahulu. File ini adalah aturan visual WAJIB — AI coding agent tidak boleh berimprovisasi di luar spesifikasi ini. Untuk aturan kepatuhan agent terhadap file ini, lihat `agent.md` Bagian 5.

---

## 📌 Changelog Update Terbaru

Update ini mengikuti finalisasi formula Priority/Severity di `techstack.md` Bagian 4.3. Bagian yang berubah:

- **Bagian 3.2** — Judul & isi diganti dari "Warna Fungsional — Severity" menjadi **"Warna Fungsional — Priority Score"**: badge warna sekarang berdasar `priority_value` (0–100), bukan severity. Ditambah tabel rentang skor per level.
- **Bagian 6** — `SeverityBadge` diganti nama jadi **`PriorityBadge`** (deskripsi diperbarui); ditambah komponen baru **`StalenessBadge`** (indikator "⚠ Menunggu X hari").
- **Bagian 8.3** — Baris **Form Lapor**: tambah step/field **Fungsi Jalan** (dropdown Arteri/Kolektor/Lokal/Lingkungan + penjelasan awam). Baris **Queue Laporan** & **Detail Laporan** (Admin): tambah PriorityBadge + StalenessBadge, dan toggle sort "Prioritas Tertinggi" vs "Terlama Menunggu".

---

## 1. Design Vision

RUAS adalah alat kerja pemerintahan yang dipakai warga, staf dinas, dan petugas lapangan sekaligus — desainnya harus terasa **kredibel dan tepercaya** (civic-tech, bukan aplikasi hiburan), **bersih dan fungsional** (setiap elemen punya alasan berada di sana), namun tetap **ramah dan mudah didekati** warga awam yang mungkin baru pertama kali memakai aplikasi pelaporan digital.

Nuansa yang ingin dicapai:
- **Profesional tanpa terasa kaku** — cocok dipakai staf dinas di kantor, tapi tidak mengintimidasi warga biasa.
- **Transparan** — visual scoring/prioritas (severity, priority score) ditampilkan apa adanya, bukan disembunyikan di balik jargon atau UI yang membingungkan.
- **Tenang, bukan ramai** — hijau & putih sebagai dasar memberi kesan bersih, terpercaya, dan berkaitan dengan infrastruktur/lingkungan, tanpa warna-warni berlebihan yang mengalihkan fokus dari data.

---

## 2. Design Principles

1. **Kejelasan navigasi di atas segalanya** — pengguna (terutama Pelapor yang awam) harus selalu tahu di mana mereka berada dan langkah apa selanjutnya. Gunakan progress indicator eksplisit di alur multi-step (mis. Form Lapor).
2. **Transparansi sebagai fitur, bukan detail teknis** — breakdown severity/priority score harus mudah ditemukan dan dipahami di halaman Admin, bukan disembunyikan.
3. **Hierarki informasi yang tegas** — informasi paling penting (severity, status, aksi utama) harus paling menonjol secara visual; informasi sekunder (metadata, timestamp) diberi bobot visual lebih ringan.
4. **Satu aksi utama per layar** — terutama di alur mobile (Form Lapor, Detail Tugas Petugas) — hindari banyak CTA bersaing dalam satu layar.
5. **Aksesibilitas bukan tambahan** — kontras warna, ukuran target sentuh, dan label teks (bukan warna semata) adalah bagian dari desain sejak awal, bukan revisi belakangan.
6. **Densitas sesuai peran** — tampilan Admin boleh lebih padat data (karena kerja analitis di desktop), tampilan Pelapor & Petugas harus lebih lapang dan sederhana (karena kerja cepat di mobile/lapangan).

---

## 3. Color System

### 3.1 Warna Dasar

| Token | Hex | Penggunaan |
|---|---|---|
| `--color-primary` | `#1E8E5A` | Hijau utama — tombol primary, aksen, nav aktif, logo |
| `--color-primary-hover` | `#166B44` | Hover/active state tombol primary |
| `--color-primary-soft` | `#F3F9F6` | Background aksen lembut, kartu highlight, background item nav aktif |
| `--color-base` | `#FFFFFF` | Background utama SELURUH aplikasi |
| `--color-surface` | `#F7F9F8` | Background halaman/section (off-white, membedakan dari card putih polos) |
| `--color-text-primary` | `#1A1A1A` | Teks utama |
| `--color-text-secondary` | `#555555` | Teks sekunder/caption |
| `--color-border` | `#E0E0E0` | Border kartu, input, tabel |

> **Aturan mutlak — TIDAK ADA DARK THEME.** Seluruh halaman aplikasi, termasuk seluruh dashboard 3 role (Pelapor, Admin, Petugas), menggunakan **Light Theme** dengan dasar putih dan aksen hijau. Jangan mengimplementasikan mode gelap di bagian mana pun.

### 3.2 Warna Fungsional — Priority Score (WAJIB konsisten: badge, peta, breakdown skor)

> **Catatan arsitektur:** Badge warna yang dilihat pengguna (Admin) dihitung dari **Priority Score** (0–100), bukan dari Severity. Severity adalah salah satu komponen input di balik Priority Score dan hanya ditampilkan sebagai detail breakdown numerik (lihat `techstack.md` Bagian 4.3) — tidak punya badge/warna sendiri yang berdiri sendiri di UI.

| Level (`priority_value`) | Rentang | Hex | Label |
|---|---|---|---|
| `critical` | 75–100 | `#C62828` | Merah |
| `high` | 50–74 | `#EF6C00` | Oranye |
| `medium` | 25–49 | `#F9A825` | Kuning |
| `low` | 0–24 | `#2E7D32` | Hijau |

### 3.3 Warna Fungsional — Status Laporan

| Status | Hex | Label |
|---|---|---|
| `baru` | `#757575` | Abu-abu |
| `diverifikasi` | `#1565C0` | Biru |
| `dijadwalkan` | `#6A1B9A` | Ungu |
| `dikerjakan` | `#F9A825` | Kuning |
| `selesai` | `#2E7D32` | Hijau |
| `ditolak` | `#C62828` | Merah |

### 3.4 Warna Sistem (feedback umum)

| Fungsi | Hex |
|---|---|
| Sukses | `#2E7D32` |
| Peringatan | `#F9A825` |
| Error | `#C62828` |
| Info | `#1565C0` |

---

## 4. Typography

- **Font:** Inter (Google Fonts), fallback `system-ui, sans-serif`.
- **Skala ukuran:**

| Kelas | Ukuran | Penggunaan |
|---|---|---|
| `text-xs` | 12px | Caption, label kecil, timestamp |
| `text-sm` | 14px | Body sekunder, deskripsi field |
| `text-base` | 16px | Body utama |
| `text-lg` | 18px | Sub-heading kecil |
| `text-xl` | 20px | Heading kartu/section |
| `text-2xl` | 24px | Heading halaman |
| `text-3xl` | 30px | Heading hero/landing |

- **Ketebalan:** Heading = `font-bold` (700), sub-heading/label penting = `font-medium` (500), body = `font-normal` (400).
- **Line height:** gunakan `leading-relaxed` (1.625) untuk paragraf panjang (FAQ, deskripsi), `leading-snug` (1.375) untuk heading.
- **Kontras:** teks body minimal rasio kontras 4.5:1 terhadap background (`--color-text-primary` di atas `--color-base`/`--color-surface` sudah memenuhi ini).

---

## 5. Layout & Hero Section

### 5.1 Grid & Spacing
- Container max-width: `1280px` di desktop, dengan padding horizontal `24px` (mobile) hingga `48px` (desktop).
- Gunakan skala spacing default Tailwind (kelipatan 4px) — jangan membuat nilai spacing custom di luar skala ini.
- Jarak antar section pada landing page: `80px` (desktop) / `48px` (mobile).
- Card internal padding: `16px` (mobile) / `24px` (desktop).

### 5.2 Hero Section (Landing Page)
- **Desktop:** layout 2 kolom — kiri: headline besar (`text-3xl`, bold) + deskripsi 1-2 kalimat (`text-lg`, `--color-text-secondary`) + 2 tombol CTA sejajar horizontal; kanan: mascot/ilustrasi sebagai focal point visual.
- **Mobile:** stack vertikal, semua center-aligned — headline dulu, lalu deskripsi, lalu 2 CTA full-width stacked, baru ilustrasi di bawah.
- **Penempatan Logo & Ikon (WAJIB):**
  - Logo (`ruas-logo.png`) di pojok kiri navbar (tinggi ~32–40px), dan di pojok kiri-atas kolom branding pada seluruh halaman autentikasi (split-screen).
  - Mascot (`ruas-mascot.png`) sebagai elemen visual utama kolom kanan Hero Section, boleh dipakai ulang di ilustrasi Section "Cara Kerja" atau empty state.
- Hero HARUS menjawab 3 hal dalam 5 detik pertama: apa produknya, untuk siapa, dan manfaat utamanya — jangan mengorbankan kejelasan ini demi visual semata.

---

## 6. Core UI Components

| Komponen | Spesifikasi |
|---|---|
| **Button (Primary)** | Background `--color-primary`, teks putih, `rounded-xl`, padding `12px 24px`, hover → `--color-primary-hover`, min-height 44px |
| **Button (Outline/Secondary)** | Border `--color-primary`, teks `--color-primary`, background transparan, hover → background `--color-primary-soft` |
| **Input Field** | Border `--color-border`, `rounded-lg`, padding `10px 14px`, focus state → border `--color-primary` + ring tipis hijau |
| **Card** | Background putih, `border border-[--color-border]`, `rounded-xl`, `shadow-sm` — konsisten di semua halaman, tidak ada varian dark |
| **PriorityBadge** | Pill kecil (`rounded-full`), warna diambil dari `priority_value` (lihat Bagian 3.2 — bukan dari severity), background warna priority dengan opacity ~15%, teks warna priority solid + label teks eksplisit (mis. "Prioritas Tinggi", bukan warna saja). Dipakai di Queue Laporan & Detail Laporan Admin sebagai badge utama yang dilihat Admin. |
| **StalenessBadge** | Pill kecil outline (bukan warna solid, agar tidak bersaing visual dengan PriorityBadge), muncul hanya jika `hari_menunggu >= 7` DAN status belum `selesai`/`ditolak`, teks "⚠ Menunggu X hari" — dihitung on-the-fly di server saat render, bukan kolom tersimpan (lihat `techstack.md` Bagian 4.3) |
| **StatusBadge** | Sama pola dengan PriorityBadge, memakai warna token status |
| **BottomNav** (Pelapor/Petugas) | Fixed bottom, background putih, border-top tipis, icon aktif memakai `--color-primary` + label kecil di bawah icon |
| **AdminSidebar** | Fixed kiri desktop, background putih, item aktif memakai background `--color-primary-soft` + teks `--color-primary` |
| **EmptyState** | Icon besar (netral, bukan warna severity), judul singkat, deskripsi 1 kalimat, tombol CTA — dipakai konsisten di semua halaman list yang bisa kosong |
| **Accordion (FAQ)** | Collapsed default, expand dengan animasi halus (lihat Bagian 7), icon chevron berputar 180° saat expand |
| **StatusStepper** | Mode vertikal (mobile) & horizontal (desktop), titik status terlewati = solid `--color-primary`, belum tercapai = outline abu-abu |

Semua icon fungsional (tombol, badge, nav) WAJIB memakai **lucide-react** — jangan mencampur dengan emoji unicode untuk elemen UI fungsional.

---

## 7. Animations

- **Durasi standar:** 150–250ms untuk micro-interaction (hover, toggle), 300ms untuk transisi antar-step form.
- **Easing:** gunakan `ease-in-out` sebagai default.
- **Penggunaan yang diizinkan:**
  - Hover/active state tombol (perubahan warna, sedikit scale `0.98` saat ditekan).
  - Expand/collapse Accordion (FAQ) — animasi tinggi halus, bukan instan.
  - Transisi antar-step Form Lapor mobile (slide horizontal halus).
  - Skeleton loading (bukan spinner polos) untuk konten yang butuh waktu muat (dashboard stats, queue laporan).
  - Toast notifikasi — slide-in dari atas/bawah, auto-dismiss.
- **Dilarang:**
  - Animasi hero yang berat (parallax kompleks, elemen melayang berlebihan) yang bisa memperlambat mobile.
  - Auto-playing carousel/slider apa pun.
  - Animasi dekoratif yang tidak berkaitan dengan feedback aksi pengguna.
- Hormati preferensi sistem `prefers-reduced-motion` — nonaktifkan animasi non-esensial jika pengguna mengaktifkan pengaturan ini.

---

## 8. Responsiveness

### 8.1 Prinsip Mobile-First (WAJIB)
Tulis style dasar untuk mobile terlebih dahulu, tambahkan breakpoint `md:`/`lg:` untuk penyesuaian desktop. **Satu komponen** untuk semua ukuran layar — tidak ada file/komponen terpisah untuk versi mobile vs desktop.

Breakpoint standar (Tailwind default): Mobile `< 768px` (default) · Tablet/Desktop kecil `md: ≥768px` · Desktop `lg: ≥1024px`.

### 8.2 Pola Navigasi per Role
- **Pelapor & Petugas:** Bottom Navigation fixed di mobile; opsional sidebar ringkas di desktop (terutama untuk Petugas, karena platform utamanya tetap mobile).
- **Admin:** Sidebar kiri fixed di desktop; berubah jadi bottom nav ringkas + hamburger menu di mobile.

### 8.3 Spesifikasi Halaman per Role (Ringkas — Mobile vs Desktop)

**Sebelum Login**

| Halaman | Route | Catatan Responsif |
|---|---|---|
| Landing Page | `/` | Hero 2 kolom (desktop) → stack vertikal (mobile); Cara Kerja 4 kolom → vertical stack dengan connector |
| Login | `/login` | Split-screen 2 kolom (desktop) → kolom kiri menyusut jadi header ringkas di atas form (mobile) |
| Sign Up | `/sign-up` | Sama pola split-screen; card pilih role 2 kolom (desktop) → stacked (mobile) |
| Verifikasi OTP | `/verify-otp` | Sama pola split-screen, input OTP kotak per digit tetap center di kedua ukuran |
| Forgot Password | `/forgot-password` | Sama pola split-screen |
| Reset Password | `/reset-password` | Sama pola split-screen |
| **Set Password / Aktivasi Akun** (khusus Petugas, dari link undangan) | `/set-password` | Sama pola split-screen; TIDAK ada field Pilih Peran/NIP/Instansi — hanya tampilkan nama & email (read-only) + input password baru |
| Kebijakan Privasi & Syarat Ketentuan | `/privacy-policy`, `/terms` | Halaman teks statis, layout single-column max-width terbatas di kedua ukuran |

### 8.4 Dev-Only Quick Login Shortcut (Non-Production)

Halaman Login (`/login`) boleh menampilkan panel tambahan **"Akses Cepat Peninjauan (Demo 3 Role)"** berisi 3 tombol (Warga/Admin Dinas/Petugas) yang langsung login sebagai akun demo masing-masing role — ini mempercepat proses testing/development, TAPI dengan aturan ketat berikut:

- Panel ini **hanya boleh dirender** jika environment variable `NEXT_PUBLIC_ENABLE_DEV_SHORTCUTS=true` (lihat `techstack.md` Bagian 2.5) — **BUKAN** dengan mendeteksi `NODE_ENV` secara implisit, karena Vercel Preview Deployment juga menghasilkan `NODE_ENV=production` sehingga deteksi implisit tidak cukup andal.
- Variable ini **HANYA** boleh diset `true` di `.env.local` (development lokal). **JANGAN PERNAH** menambahkannya ke environment variables project di dashboard Vercel (baik untuk target Production maupun Preview) — dengan begitu panel ini otomatis tidak pernah muncul di deployment mana pun.
- Posisi panel: di bawah divider setelah link "Daftar sebagai Pelapor", diberi jarak visual jelas (heading kecil uppercase + border/separator) agar tidak tertukar dengan elemen form produksi.
- Styling tombol: gunakan varian Button (Outline/Secondary) dari Bagian 6, BUKAN warna/style baru di luar token yang ada.
- Akun demo yang dipakai tombol ini harus berupa akun seed sungguhan (dibuat lewat `supabase/seed.sql`) — bukan bypass autentikasi palsu. Klik tombol tetap memanggil alur `supabase.auth.signInWithPassword` yang sama seperti login manual, hanya saja kredensialnya sudah diisi otomatis oleh kode (bukan diketik ulang oleh developer).

**Pelapor**

| Halaman | Route | Catatan Responsif |
|---|---|---|
| Beranda | `/pelapor` | Mobile: 2 statistik ringkas + FAB kamera. Desktop: 4 kartu statistik penuh, tanpa FAB (tombol Lapor Baru di header) |
| Form Lapor | `/pelapor/lapor` | Mobile: multi-step (Foto→Preview→Lokasi→**Fungsi Jalan**→Deskripsi→Konfirmasi), full-screen tanpa nav. Desktop: single-page 2 kolom (upload drag-drop + map, field Fungsi Jalan di bawah map). Step **Fungsi Jalan**: dropdown wajib pilih salah satu — Arteri, Kolektor, Lokal, Lingkungan — masing-masing opsi disertai 1 kalimat penjelasan awam (mis. "Lokal — jalan di dalam permukiman/kompleks, bukan jalan utama") supaya Pelapor yang tidak familiar istilah teknis tetap bisa memilih benar. Field ini WAJIB diisi karena jadi komponen Exposure (E) di perhitungan Priority — lihat `techstack.md` Bagian 4.3. |
| Hasil Deteksi | `/pelapor/lapor/hasil/[id]` | Mobile: kartu tunggal center. Desktop: side-by-side foto & info detail |
| Riwayat Laporan | `/pelapor/riwayat` | Mobile: list card + filter chip scroll horizontal. Desktop: tabel sortable |
| Detail Laporan | `/pelapor/riwayat/[id]` | Stepper status vertikal (mobile) / horizontal (desktop) |
| Profil | `/pelapor/profil` | Layout sama di kedua ukuran, max-width terbatas di desktop |

**Admin Dinas**

| Halaman | Route | Catatan Responsif |
|---|---|---|
| Dashboard | `/admin` | Mobile: statistik jadi carousel horizontal, peta di tab terpisah. Desktop: grid 4 kartu + peta besar + grafik berdampingan |
| Queue Laporan | `/admin/queue` | Mobile: list card (PriorityBadge + StalenessBadge jika ada) + filter bottom sheet. Desktop: tabel + filter panel + bulk action. Toggle urutan default di header tabel: **"Prioritas Tertinggi"** (sort by `priority_value` desc, default) vs **"Terlama Menunggu"** (sort by `created_at` asc) — dua mode sort terpisah, bukan dicampur jadi satu formula |
| Detail Laporan | `/admin/queue/[id]` | Mobile: stack vertikal (PriorityBadge + StalenessBadge di atas), tombol aksi sticky bawah. Desktop: 2 kolom (foto+map kiri, breakdown skor & aksi kanan). Breakdown skor kanan menampilkan: PriorityBadge besar di atas, lalu rincian numerik di bawahnya (Severity raw, S_norm, Exposure/Fungsi Jalan, formula akhir) — severity TIDAK punya badge warna sendiri di sini, hanya angka dalam tabel breakdown |
| Manajemen Petugas | `/admin/petugas` | Mobile: list card (lihat saja). Desktop: tabel penuh + form tambah petugas |
| Laporan & Analitik | `/admin/analitik` | Mobile: 2-3 grafik utama. Desktop: grid multi-grafik lengkap |
| Pengaturan | `/admin/pengaturan` | Layout sama di kedua ukuran |

**Petugas Lapangan**

| Halaman | Route | Catatan Responsif |
|---|---|---|
| Tugas Saya | `/petugas` | Mobile-first murni — list card tugas aktif |
| Detail Tugas | `/petugas/tugas/[id]` | Stack vertikal, tombol aksi besar mudah dijangkau jempol |
| Riwayat Tugas | `/petugas/riwayat` | List before-after (foto asli vs bukti) berdampingan |
| Profil | `/petugas/profil` | Layout sederhana |

---

## 9. Anti-Slop / Design Anti-Patterns Rules

AI coding agent DILARANG menerapkan pola-pola berikut, meskipun secara teknis "terlihat modern":

1. **Dilarang** menggunakan hero section dengan gradient blob dekoratif tanpa makna, ilustrasi stok generik yang tidak relevan dengan konteks jalan/infrastruktur, atau lorem ipsum yang dibiarkan di build akhir.
2. **Dilarang** menambahkan efek glassmorphism/blur berlebihan yang mengurangi kontras dan keterbacaan teks.
3. **Dilarang** membuat carousel/slider otomatis untuk konten yang seharusnya statis (mis. Section Pembuat) — carousel hanya boleh dipakai jika ada alasan fungsional jelas dan dikontrol pengguna.
4. **Dilarang** menggunakan warna sebagai satu-satunya penanda status/severity — selalu sertakan label teks eksplisit (lihat Bagian 8 `prd.md` Non-Functional Requirements — Aksesibilitas).
5. **Dilarang** menumpuk card di dalam card tanpa keperluan (nested card berlebihan) yang membuat hierarki visual membingungkan.
6. **Dilarang** membuat tombol/ikon aksi kritikal (Verifikasi, Assign, Tandai Selesai) hanya berupa ikon tanpa label teks.
7. **Dilarang** memakai dark pattern apa pun (tombol menyesatkan, countdown/urgency palsu, opt-out tersembunyi) — ini aplikasi pemerintahan yang harus dipercaya penuh oleh warga.
8. **Dilarang** menambahkan modal/popup yang muncul tanpa dipicu aksi pengguna (mis. newsletter popup, "install app" prompt tiba-tiba).
9. **Dilarang** membuat elemen dekoratif yang meniru fungsi asli tapi tidak fungsional (mis. search bar palsu, badge notifikasi angka statis yang tidak terhubung data asli).
10. **Dilarang** menggunakan spacing/ukuran font di luar skala yang ditetapkan Bagian 4 & 5.1 — konsistensi lebih penting daripada variasi visual "menarik".
11. **Dilarang** mengimplementasikan dark theme di bagian mana pun (lihat Bagian 3.1) — termasuk toggle dark mode sebagai "fitur tambahan" yang tidak diminta.
