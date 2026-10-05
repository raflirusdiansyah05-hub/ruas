# agent.md — RUAS

> Ini adalah aturan operasional untuk AI Coding Agent. Dokumen ini mengasumsikan `prd.md`, `design.md`, dan `techstack.md` sudah dibaca. Jika ada konflik instruksi dari pengguna dengan dokumen ini, klarifikasi dulu sebelum melanjutkan — jangan berimprovisasi di luar spesifikasi.

---

## 📌 Changelog Update Terbaru (Round 3)

- **Fase 3** — Hosting ML service **dikembalikan ke Render** (Hugging Face Spaces ternyata sekarang mewajibkan paid plan untuk SDK Docker — lihat `techstack.md` Bagian 4.5 untuk detail & konfirmasinya). Model tetap `yolo26n.pt`, file FastAPI tetap `app.py` dengan CORS + health check endpoint.

## 📌 Changelog Round 2 (riwayat — hosting-nya sudah dibalik lagi di Round 3)

- **Fase 3** — Model diganti jadi `yolo26n.pt` (YOLO26); file FastAPI jadi `app.py` (📌 bukan `main.py`) — bagian ini tetap berlaku. ~~hosting ML service diganti ke Hugging Face Spaces~~ — dibatalkan di Round 3.

## 📌 Changelog Round 1 (riwayat)

Mengikuti finalisasi Priority/Severity & aktivasi model AI asli. Bagian yang berubah:

- **Fase 3** — Tambah langkah deploy FastAPI + set env Vercel; tambah field Fungsi Jalan di Form Lapor + migration; tegaskan formula final priority (tanpa komponen waktu).
- **Fase 4** — Tambah toggle sort "Terlama Menunggu"; ganti `SeverityBadge`→`PriorityBadge`; tambah `StalenessBadge`.
- **Fase 6** — Deploy production sekarang pakai `AI_PROVIDER=remote` (bukan `mock`).

---

## 1. Project Overview & Workflow

**Urutan membaca dokumen (WAJIB, dalam urutan ini):**
1. `prd.md` — pahami masalah, tujuan, dan cakupan fitur sebelum menyentuh kode apa pun.
2. `design.md` — pahami aturan visual sebelum membangun komponen UI apa pun.
3. `techstack.md` — pahami arsitektur, skema database, dan kontrak API sebelum menulis logic backend.
4. `agent.md` (dokumen ini) — pahami aturan kerja sebelum mulai eksekusi.

**Alur perencanaan wajib sebelum menulis kode:**
1. Identifikasi fase mana dari Master Task List (Bagian 8) yang sedang dikerjakan.
2. Tulis ringkasan singkat rencana: file apa yang akan dibuat/diubah, dan bagian mana dari `prd.md`/`design.md`/`techstack.md` yang menjadi rujukan.
3. Konfirmasi rencana tersebut konsisten dengan fase saat ini — **jangan mengerjakan fase berikutnya sebelum fase sebelumnya selesai dan berfungsi**.
4. Baru mulai menulis/mengubah kode.

Jika sebuah instruksi dari pengguna tidak jelas atau berpotensi bertentangan dengan `prd.md` (misalnya menambah fitur yang tidak ada di Scope), agent harus menyampaikan hal ini secara eksplisit sebelum mengeksekusi, bukan diam-diam menambah scope.

---

## 2. Mandatory Skills

Agent harus mempraktikkan keahlian berikut sesuai konteks tugas:

| Area | Praktik Wajib |
|---|---|
| **Frontend (Next.js/React)** | App Router patterns (Server vs Client Components), mobile-first responsive implementation sesuai `design.md`, penggunaan shadcn/ui secara idiomatik (bukan override CSS berlebihan) |
| **Backend (Route Handlers)** | Validasi input konsisten (Zod), error handling terstruktur, tidak pernah mempercayai data client mentah-mentah |
| **Database (Supabase/Postgres)** | Menulis migration SQL yang aman (idempotent bila memungkinkan), memahami dan menerapkan RLS dengan benar — bukan sekadar mengaktifkan tapi membiarkan policy longgar |
| **Keamanan** | Memahami perbedaan `anon key` vs `service_role key`, tidak pernah expose secret ke client, memvalidasi otorisasi role di setiap endpoint sensitif |
| **Cross-referencing dokumen** | Mampu menelusuri referensi silang antar file (mis. `prd.md` menyebut detail teknis ada di `techstack.md`) tanpa kehilangan konteks |

---

## 3. Architecture & Data Flow

- Struktur folder WAJIB mengikuti `techstack.md` Bagian 2.2 — jangan membuat struktur folder alternatif meski "menurut agent lebih rapi".
- **Aturan interaksi komponen:**
  - Komponen UI (`components/`) **tidak boleh** memanggil Supabase langsung — semua akses data lewat `lib/supabase/client.ts` (Client Component) atau `lib/supabase/server.ts` (Server Component/Action).
  - Logic AI **hanya** boleh diakses lewat `lib/ai/index.ts` (`getDetectionProvider()`) — komponen/route handler tidak boleh mengimpor `mock-provider.ts` atau `remote-provider.ts` secara langsung.
  - Logic scoring (`lib/scoring/`) adalah fungsi murni (pure function) — tidak melakukan query database sendiri, hanya menerima data dan mengembalikan hasil hitung.
  - Setiap perubahan status laporan (`reports.status`, `assignments.status`) **wajib** disertai insert ke `status_history` dalam transaksi/urutan logic yang sama — tidak boleh terpisah jadi langkah opsional.
- **Data flow satu arah:** Client → Route Handler → Supabase/AI Provider → Route Handler → Client. Jangan membuat Client Component memanggil beberapa service eksternal secara paralel tanpa melalui route handler, kecuali untuk upload file langsung ke Supabase Storage (yang memang didesain client-side, lihat `techstack.md` Bagian 4.4).

---

## 4. Code Quality & Coding Standards

- **Single Responsibility:** satu file/fungsi menangani satu tanggung jawab. Route handler tidak boleh berisi logic scoring/AI secara langsung — panggil fungsi dari `lib/`.
- **Batasan ukuran file:** jika sebuah file `.tsx`/`.ts` melebihi ~250–300 baris, evaluasi apakah perlu dipecah menjadi komponen/fungsi lebih kecil.
- **TypeScript strict:** aktifkan `strict: true` di `tsconfig.json`. **Dilarang** menggunakan tipe `any` kecuali benar-benar tidak terhindarkan (dan wajib diberi komentar alasan). Semua props komponen, response API, dan hasil query Supabase harus bertipe eksplisit.
- **Penamaan:** `kebab-case` untuk file/folder, `PascalCase` untuk komponen React, `camelCase` untuk fungsi/variabel, `snake_case` untuk kolom/tabel database (mengikuti `techstack.md`).
- **Validasi input:** setiap route handler WAJIB memvalidasi body/query dengan Zod schema dari `lib/validations/` sebelum diproses.
- **Error handling konsisten:** format error API selalu `{ error: { message, code? } }` dengan HTTP status code yang sesuai (400/401/403/404/500) — lihat `techstack.md` Bagian 4.1.
- **Server Component by default:** gunakan `"use client"` hanya untuk komponen yang benar-benar butuh interaktivitas (form, map, uploader, dropdown notifikasi).

---

## 5. Design, Animation, & Anti-Slop Rules

Agent WAJIB patuh mutlak terhadap `design.md` — tidak ada improvisasi visual di luar spesifikasi tersebut. Secara khusus:

- Seluruh warna WAJIB memakai token dari `design.md` Bagian 3 — dilarang menulis kode hex baru langsung di komponen.
- **Tidak ada dark theme** di bagian mana pun — ini aturan mutlak, bukan preferensi (lihat `design.md` Bagian 3.1).
- Seluruh halaman WAJIB mobile-first sesuai `design.md` Bagian 8 — uji tiap halaman baru di lebar viewport 375px sebelum dianggap selesai.
- Animasi hanya boleh sesuai daftar yang diizinkan di `design.md` Bagian 7 — dilarang menambah animasi dekoratif di luar itu.
- Seluruh 11 aturan di `design.md` Bagian 9 (Anti-Slop) berlaku sebagai **hard constraint**, bukan saran. Jika agent tergoda menambahkan elemen "supaya terlihat lebih menarik" (carousel, gradient blob, modal promosi, dsb.), itu justru sinyal untuk berhenti dan cek ulang Bagian 9.
- Ikon fungsional wajib dari `lucide-react`, bukan emoji (lihat `design.md` Bagian 6).

---

## 6. Documentation, Performance, & Testing

- **Dokumentasi inline:** setiap fungsi non-trivial (terutama `lib/scoring/`, `lib/ai/`, dan route handler yang melakukan >1 operasi database) wajib diberi komentar singkat menjelaskan tujuan dan asumsi, bukan menjelaskan ulang apa yang sudah jelas dari nama fungsi.
- **Performa:**
  - Kompresi gambar wajib terjadi sebelum upload (lihat `techstack.md` Bagian 4.4) — jangan lewati langkah ini demi kecepatan development.
  - Hindari query N+1 — gunakan `select` dengan join Supabase (`.select('*, detections(*), priority_scores(*)')`) alih-alih multiple round-trip query terpisah.
  - Gunakan pagination pada Queue Laporan dan Riwayat Laporan begitu data berpotensi banyak — jangan fetch seluruh tabel sekaligus.
- **Testing:**
  - Fungsi di `lib/scoring/` (severity & priority) WAJIB memiliki unit test — ini logic bisnis inti yang harus terverifikasi benar, mengingat sifatnya yang harus transparan dan bisa diaudit (lihat `prd.md` Bagian 5.4).
  - Alur autentikasi kritikal (verifikasi NIP, invite petugas) sebaiknya diuji manual end-to-end pada tiap fase terkait sebelum dianggap selesai (lihat Master Task List Bagian 8).
  - Tidak wajib membangun test coverage penuh di seluruh aplikasi untuk fase MVP — prioritaskan logic yang berisiko tinggi jika salah (scoring, auth, RLS).

---

## 7. Do Not Use & Decision Framework

### 7.1 Daftar Hitam (Dilarang Digunakan)
- **Prisma** atau ORM lain — gunakan `@supabase/supabase-js` langsung (lihat `techstack.md` Bagian 2.1).
- **CSS-in-JS** (styled-components, emotion, dsb.) — gunakan Tailwind CSS saja.
- **Redux/Zustand** untuk state management global — gunakan React Server Components, URL state, atau `useState`/`useReducer` lokal; kompleksitas state di aplikasi ini tidak membutuhkan state management global.
- **jQuery** atau manipulasi DOM manual — semua lewat React.
- **localStorage/sessionStorage untuk menyimpan token auth** — session ditangani penuh oleh `@supabase/ssr` lewat cookie.
- **Auth custom buatan sendiri** (hashing password manual, JWT manual, dsb.) — WAJIB pakai Supabase Auth.
- **Dark mode/theme switcher** dalam bentuk apa pun (lihat `design.md` Bagian 3.1).
- **Emoji sebagai ikon fungsional** di tombol/badge/nav (lihat `design.md` Bagian 6).
- **Google Maps API / peta berbayar** — gunakan Leaflet + OpenStreetMap (lihat `techstack.md` Bagian 2.1).
- Menambah dependency baru di luar daftar `techstack.md` Bagian 2.1 tanpa mencatatkannya dulu di dokumen tersebut.

### 7.2 Decision Framework (Saat Menghadapi Pilihan Ganda)
1. **Cek dulu apakah keputusan sudah diatur eksplisit** di `prd.md`/`design.md`/`techstack.md` — jangan menebak jika sudah ada aturannya.
2. Jika ada opsi ambigu yang tidak diatur eksplisit, **pilih solusi paling sederhana yang konsisten dengan stack yang sudah ada** — bukan yang paling "canggih" atau baru dipelajari.
3. Prioritas rujukan bila dokumen tampak tumpang tindih: `prd.md` menentukan **apa** yang harus ada dan **mengapa** (kebutuhan produk); `design.md` menentukan **bagaimana tampilannya**; `techstack.md` menentukan **bagaimana cara membangunnya**. Untuk keputusan implementasi teknis spesifik, `techstack.md` yang menjadi rujukan akhir.
4. Jika sebuah task tampak akan memperluas Scope di luar `prd.md` Bagian 7, **berhenti dan tanyakan** ke pengguna — jangan menganggap itu "perbaikan kecil" yang boleh dilakukan sepihak.
5. Ketika ragu antara "menambah fitur ekstra untuk jaga-jaga" vs "membangun persis sesuai spesifikasi" — selalu pilih yang kedua. Scope creep adalah risiko yang secara eksplisit ingin dihindari proyek ini.

---

## 8. Task Tracking Rules

Agent WAJIB mencatat progres ke dalam file `TASKS.md` (dibuat di root proyek jika belum ada), dengan menyalin Master Task List di bawah ini dan mencentang `[x]` setiap item HANYA setelah item tersebut **selesai diimplementasi DAN diuji berjalan** — bukan sekadar kode tertulis.

**Prosedur wajib:**
- Update `TASKS.md` setiap kali sebuah fitur/checklist item selesai — jangan menumpuk banyak perubahan lalu update sekali di akhir sesi.
- Jangan menandai fase selesai (`Selesai jika: ...`) jika kriteria di bawah checklist fase tersebut belum sepenuhnya terpenuhi.
- Jika sebuah task diskip/ditunda, catat alasannya sebagai komentar di `TASKS.md`, jangan dihapus diam-diam dari daftar.
- Commit message sebaiknya merujuk fase & task terkait (mis. `feat(fase-3): implementasi form lapor multi-step`).

### Master Task List

**Fase 0 — Setup Proyek**
- [ ] Inisialisasi Next.js 14 (App Router, TypeScript, Tailwind) sesuai struktur `techstack.md` Bagian 2.2.
- [ ] Install seluruh dependency inti sesuai `techstack.md` Bagian 2.1.
- [ ] Setup Tailwind config dengan token desain dari `design.md` Bagian 3–4.
- [ ] Buat project Supabase, isi `.env.local` sesuai `techstack.md` Bagian 2.5.
- [ ] Jalankan seluruh migration SQL (`techstack.md` Bagian 2.3) secara berurutan, aktifkan RLS.
- [ ] Buat storage bucket `reports` dan `proofs`.
- [ ] Isi `seed.sql` dengan minimal 5 data dummy `instansi_referensi`.
- [ ] Push ke GitHub, hubungkan Vercel, pastikan deploy awal berhasil.
- [ ] Taruh `ruas-logo.png` dan `ruas-mascot.png` ke `public/images/`.
- **Selesai jika:** aplikasi ter-deploy tanpa error, koneksi Supabase berhasil.

**Fase 1 — Design System & Halaman Pre-Login**
- [ ] Setup `globals.css` dengan CSS variables sesuai `design.md`. Light theme saja — TIDAK ADA dark mode di halaman mana pun.
- [ ] Bangun komponen dasar shadcn/ui: Button, Input, Card, Badge, Accordion, Checkbox, Dialog.
- [ ] Bangun Landing Page lengkap sesuai `design.md` Bagian 5.
- [ ] Bangun Login, Sign Up (conditional field role), Verifikasi OTP, Forgot/Reset Password, dan Set Password (aktivasi Petugas) sesuai `design.md` Bagian 8.3 — boleh dummy submit handler dulu, fokus UI & responsivitas.
- [ ] Bangun panel "Akses Cepat Demo 3 Role" di halaman Login sesuai `design.md` Bagian 8.4, dikontrol `NEXT_PUBLIC_ENABLE_DEV_SHORTCUTS` (default `false`, aktifkan hanya di `.env.local`).
- [ ] Bangun halaman Kebijakan Privasi & Syarat Ketentuan (boleh konten generik di awal).
- [ ] Uji responsivitas tiap halaman di 375px dan 1280px.
- **Selesai jika:** seluruh halaman pre-login bisa dinavigasi, responsif, sesuai token warna.

**Fase 2 — Autentikasi Penuh**
- [ ] Implementasikan `lib/supabase/client.ts` dan `server.ts`.
- [ ] Implementasikan Sign Up Pelapor + trigger `on_auth_user_created`.
- [ ] Implementasikan `POST /api/auth/verify-nip`.
- [ ] Hubungkan Sign Up Admin dengan verify-nip sebelum `signUp`.
- [ ] Implementasikan Verifikasi OTP, Login (redirect by role), Forgot/Reset Password.
- [ ] Implementasikan `middleware.ts` proteksi route berbasis role.
- [ ] Implementasikan `POST /api/petugas/invite` + halaman `/set-password` sesuai `techstack.md` Bagian 4.2.
- [ ] Uji alur invite end-to-end: Admin invite → email masuk → set password → masuk `/petugas`.
- **Selesai jika:** ketiga role bisa register/login/redirect dengan benar, route terproteksi sesuai role.

**Fase 3 — Alur Pelapor (termasuk integrasi AI)**
- [ ] Implementasikan `lib/ai/` lengkap sesuai `techstack.md` Bagian 4.5, termasuk `remote-provider.ts` (📌 AKTIF — resize 640×640 via `sharp` + panggil FastAPI di Render, bukan lagi sekadar disiapkan).
- [ ] Deploy service FastAPI (`app.py` + `yolo26n.pt` + `Dockerfile`) ke Render dan catat URL endpoint `*.onrender.com`-nya; set `AI_REMOTE_ENDPOINT` + `AI_PROVIDER=remote` di Vercel (📌 diupdate — lihat `techstack.md` Bagian 4.5).
- [ ] Implementasikan `lib/scoring/severity.ts` dan `priority.ts` sesuai `techstack.md` Bagian 4.3 (formula final: `priority_value = 0.70·S_norm + 0.30·E`, TANPA komponen waktu).
- [ ] Bangun `<PhotoUploader />` (dengan kompresi) dan `<LocationPicker />` (GPS + Leaflet + reverse geocoding).
- [ ] Bangun Form Lapor multi-step (mobile) + single-page (desktop), **termasuk step/field baru Fungsi Jalan** (dropdown Arteri/Kolektor/Lokal/Lingkungan + penjelasan awam, 📌 baru — `design.md` Bagian 8.3).
- [ ] Tambahkan kolom `fungsi_jalan` ke migration tabel `reports` (📌 baru — `techstack.md` Bagian 2.3).
- [ ] Implementasikan `POST /api/reports` lengkap (simpan → resize+AI → scoring S_norm/Exposure/Priority → history → notifikasi).
- [ ] Bangun Halaman Hasil Deteksi dengan bounding box overlay, tampilkan **Priority Score** (bukan severity mentah) sebagai hasil utama.
- [ ] Bangun Beranda, Riwayat, Detail Laporan, Profil Pelapor dengan data real.
- **Selesai jika:** Pelapor bisa lapor end-to-end (termasuk pilih Fungsi Jalan) sampai muncul di Riwayat dengan priority score benar dari model AI asli di Render.

**Fase 4 — Alur Admin Dinas**
- [ ] Bangun Dashboard (statistik, peta Leaflet, grafik tren).
- [ ] Bangun Queue Laporan: sort default by `priority_value` desc, **toggle ke "Terlama Menunggu"** (sort by `created_at` asc, 📌 baru), filter multi-kriteria (termasuk `fungsi_jalan`).
- [ ] Implementasikan komponen **`PriorityBadge`** (ganti nama dari `SeverityBadge`, 📌 lihat `design.md` Bagian 6) dan **`StalenessBadge`** ("⚠ Menunggu X hari", dihitung on-the-fly dari `created_at` — lihat kode `hari_menunggu` di `techstack.md` Bagian 4.3, bukan kolom DB).
- [ ] Bangun Detail Laporan Admin (breakdown skor: PriorityBadge besar + rincian numerik Severity/S_norm/Exposure, Verifikasi/Tolak/Assign, catatan internal).
- [ ] Bangun Manajemen Petugas (tabel + form invite).
- [ ] Bangun Laporan & Analitik + export CSV.
- [ ] Bangun Pengaturan Admin.
- [ ] Pastikan semua perubahan status tercatat di `status_history`.
- **Selesai jika:** Admin bisa verifikasi, assign, lihat PriorityBadge+StalenessBadge, toggle sort, dan analitik dasar.

**Fase 5 — Alur Petugas Lapangan**
- [ ] Bangun Tugas Saya (list assignment aktif).
- [ ] Bangun Detail Tugas (Google Maps link, Mulai/Selesai, upload bukti wajib).
- [ ] Bangun Riwayat Tugas (before-after).
- [ ] Bangun Profil Petugas.
- [ ] Pastikan status `selesai` di assignment memperbarui `reports.status` juga.
- **Selesai jika:** Petugas bisa update status & upload bukti, langsung terlihat di sisi Pelapor & Admin.

**Fase 6 — Notifikasi, Polish & Finalisasi**
- [ ] Implementasikan tabel & endpoint `notifications` + trigger otomatis (status berubah, laporan urgent, tugas baru).
- [ ] Tampilkan dropdown notifikasi di semua layout header dengan badge unread count.
- [ ] Review seluruh halaman terhadap `design.md` (warna konsisten, mobile-first, empty state, TIDAK ADA dark mode).
- [ ] Review seluruh checklist `prd.md` Bagian 5 — pastikan semua item WAJIB tercentang.
- [ ] Uji alur end-to-end penuh 3 role.
- [ ] Verifikasi environment variables project Vercel (Production & Preview) TIDAK berisi `NEXT_PUBLIC_ENABLE_DEV_SHORTCUTS` — pastikan panel demo login tidak muncul di deployment mana pun (lihat `design.md` Bagian 8.4).
- [ ] Deploy final ke Vercel production dengan `AI_PROVIDER=remote` + `AI_REMOTE_ENDPOINT` terisi URL Render (📌 diperbarui — bukan lagi `mock`, karena model asli sudah aktif).
- **Selesai jika:** seluruh alur 3 role berjalan mulus di production tanpa error.

**Fase 7 (Opsional) — Hanya Jika Waktu Tersisa**
Urutan prioritas: (1) Notifikasi WhatsApp/Email, (2) Bulk action Queue Admin, (3) Rating/feedback perbaikan, (4) Statistik publik, (5) Mode offline-lite, (6) Pengaturan threshold scoring.

---

## 9. Environment & Tool Usage Rules

- **Terminal:** gunakan hanya untuk instalasi dependency, menjalankan build/lint/test, dan migration database. Jangan menjalankan dev server dalam waktu lama tanpa keperluan aktif (mis. dibiarkan berjalan di background tanpa dipakai untuk verifikasi).
- **Browser automation (jika tersedia):** gunakan hanya untuk memverifikasi hasil render UI terhadap spesifikasi `design.md` (mis. cek responsivitas, cek warna token) — bukan untuk browsing umum di luar keperluan proyek.
- **Pembacaan file:** fokus pada file di dalam proyek (`app/`, `components/`, `lib/`, `supabase/`) — hindari menelusuri `node_modules` atau file build hasil generate kecuali untuk debugging spesifik.
- **Jangan memodifikasi file di luar root proyek** atau file konfigurasi environment yang tidak berkaitan dengan proyek ini.
- **Efisiensi sumber daya:** sebelum menjalankan operasi berat (build penuh, migration ulang), pastikan itu benar-benar diperlukan oleh task saat ini — jangan menjalankan langkah verifikasi berulang-ulang untuk perubahan kecil yang sudah jelas hasilnya.
- Saat ragu apakah sebuah tool/aksi diperlukan, pilih pendekatan yang paling minim risiko terhadap data/konfigurasi yang sudah berjalan (khususnya migration database — jangan menjalankan ulang migration yang berpotensi menghapus data tanpa konfirmasi eksplisit).
