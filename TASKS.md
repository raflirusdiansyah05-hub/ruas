# TASKS.md — RUAS Master Task List

> File ini adalah tracker progres implementasi RUAS sesuai `agent.md`. Status hanya dicentang `[x]` setelah kode selesai DAN berhasil diuji.

---

## Fase 0 — Setup Proyek
- [x] Inisialisasi Next.js 14 (App Router, TypeScript, Tailwind) sesuai struktur `techstack.md` Bagian 2.2 langsung di direktori USB.
- [x] Install seluruh dependency inti sesuai `techstack.md` Bagian 2.1 (@supabase/supabase-js, @supabase/ssr, lucide-react, react-hook-form, zod, leaflet, react-leaflet, recharts, browser-image-compression, shadcn radix primitives, dll).
- [x] Setup Tailwind config dengan token desain dari `design.md` Bagian 3–4 (primary #1E8E5A, severity colors, status colors, feedback colors, Inter font).
- [x] Buat file konfigurasi environment `.env.example` dan `.env.local` sesuai `techstack.md` Bagian 2.5.
- [x] Buat seluruh file migration SQL (`techstack.md` Bagian 2.3) secara berurutan di `supabase/migrations/` (0001_profiles.sql s/d 0008_notifications.sql) + trigger `on_auth_user_created` dan RLS aktif pada seluruh tabel.
- [x] Dokumentasikan setup storage bucket `reports` dan `proofs`.
- [x] Isi `supabase/seed.sql` dengan 5+ data dummy `instansi_referensi` ASN/Dinas.
- [x] Setup file asset logo & maskot SVG di `public/images/` (`ruas-logo.svg`, `ruas-mascot.svg`).
- [x] Buat `types/database.ts` untuk type-safety PostgreSQL Supabase.
- [x] Verifikasi build & typecheck berjalan sukses (`npm run build` sukses 100%).
- **Selesai jika:** struktur proyek lengkap, build/typecheck sukses tanpa error, file konfigurasi dan migrasi SQL siap. *(Status: SELESAI)*

---

## Fase 1 — Design System & Halaman Pre-Login
- [x] Setup `globals.css` dengan CSS variables sesuai `design.md`. Light theme saja — TIDAK ADA dark mode di halaman mana pun.
- [x] Bangun komponen dasar shadcn/ui: Button, Input, Card, Badge, Accordion, Checkbox, Dialog, SeverityBadge, StatusBadge, EmptyState.
- [x] Bangun Landing Page lengkap sesuai `design.md` Bagian 5 (Hero 2 kolom, focal point mascot, Cara Kerja 4 step, Tiga Role Card, Accordion FAQ, CTA Banner, Footer).
- [x] Bangun Login, Sign Up (conditional field role Pelapor vs Admin dengan NIP & Instansi), Verifikasi OTP (6 digit input box), Forgot Password, Reset Password, dan Set Password (khusus aktivasi Petugas, read-only identity) sesuai `design.md` Bagian 8.3.
- [x] Bangun halaman Kebijakan Privasi (`/privacy-policy`) & Syarat Ketentuan (`/terms`).
- [x] Uji responsivitas, navigasi rute, typecheck, dan prerendering build: seluruh 9 rute menghasilkan HTTP 200 tanpa error.
- **Selesai jika:** seluruh halaman pre-login bisa dinavigasi, responsif, sesuai token warna. *(Status: SELESAI)*

---

## Fase 2 — Autentikasi Penuh
- [x] Implementasikan `lib/supabase/client.ts` dan `server.ts` (termasuk `createAdminClient` dengan service role).
- [x] Implementasikan Sign Up Pelapor + trigger `on_auth_user_created` di database.
- [x] Implementasikan `POST /api/auth/verify-nip` untuk validasi NIP dan instansi dari `instansi_referensi`.
- [x] Hubungkan Sign Up Admin dengan verify-nip sebelum `signUp`.
- [x] Implementasikan Verifikasi OTP, Login (redirect by role ke `/pelapor`, `/admin`, `/petugas`), Forgot/Reset Password.
- [x] Implementasikan `middleware.ts` proteksi route berbasis role cookie session.
- [x] Implementasikan `POST /api/petugas/invite` + halaman `/set-password` sesuai `techstack.md` Bagian 4.2.
- [x] Uji build dan typecheck: seluruh rute auth dan proteksi compiled sukses tanpa error.
- **Selesai jika:** ketiga role bisa register/login/redirect dengan benar, route terproteksi sesuai role. *(Status: SELESAI)*

---

## Fase 3 — Alur Pelapor (termasuk Mock AI)
- [x] Implementasikan `lib/ai/` lengkap sesuai `techstack.md` Bagian 4.5 (`types.ts`, `mock-provider.ts`, `remote-provider.ts`, `index.ts`).
- [x] Implementasikan `lib/scoring/severity.ts` dan `priority.ts` sesuai `techstack.md` Bagian 4.3 + unit test (`lib/scoring/scoring.test.ts` lulus 100%).
- [x] Bangun `<PhotoUploader />` (dengan kompresi `browser-image-compression` ke target ~1MB) dan `<LocationPicker />` (GPS geolocation + reverse geocoding Nominatim).
- [x] Bangun Form Lapor multi-step (mobile) + single-page (desktop) di `/pelapor/lapor`.
- [x] Implementasikan `POST /api/reports` lengkap (simpan report → panggil AI provider → hitung severity & priority → insert `detections` & `priority_scores` → catat `status_history`).
- [x] Bangun Halaman Hasil Deteksi (`/pelapor/lapor/hasil/[id]`) dengan bounding box overlay dan breakdown skor transparan.
- [x] Bangun Beranda Pelapor (`/pelapor`), Riwayat (`/pelapor/riwayat`), Detail Laporan (`/pelapor/riwayat/[id]`), dan Profil Pelapor (`/pelapor/profil`).
- **Selesai jika:** Pelapor bisa lapor end-to-end sampai muncul di Riwayat dengan severity benar. *(Status: SELESAI)*

---

## Fase 4 — Alur Admin Dinas
- [x] Bangun Dashboard (statistik, peta Leaflet, grafik tren).
- [x] Bangun Queue Laporan (sort by priority_value, filter multi-kriteria).
- [x] Bangun Detail Laporan Admin (breakdown skor, Verifikasi/Tolak/Assign, catatan internal).
- [x] Bangun Manajemen Petugas (tabel + form invite).
- [x] Bangun Laporan & Analitik + export CSV.
- [x] Bangun Pengaturan Admin.
- [x] Pastikan semua perubahan status tercatat di `status_history`.
- **Selesai jika:** Admin bisa verifikasi, assign, dan melihat analitik dasar. *(Status: SELESAI)*

---

## Fase 5 — Alur Petugas Lapangan
- [x] Bangun Tugas Saya (list assignment aktif).
- [x] Bangun Detail Tugas (Google Maps link, Mulai/Selesai, upload bukti wajib).
- [x] Bangun Riwayat Tugas (before-after).
- [x] Bangun Profil Petugas.
- [x] Pastikan status `selesai` di assignment memperbarui `reports.status` juga.
- **Selesai jika:** Petugas bisa update status & upload bukti, langsung terlihat di sisi Pelapor & Admin. *(Status: SELESAI)*

---

## Fase 6 — Notifikasi, Polish & Finalisasi
- [x] Implementasikan tabel & endpoint `notifications` + trigger otomatis (status berubah, laporan urgent, tugas baru).
- [x] Tampilkan dropdown notifikasi di semua layout header dengan badge unread count.
- [x] Review seluruh halaman terhadap `design.md` (warna konsisten, mobile-first, empty state, TIDAK ADA dark mode).
- [x] Review seluruh checklist `prd.md` Bagian 5 — pastikan semua item WAJIB tercentang.
- [x] Uji alur end-to-end penuh 3 role.
- [x] Siap deploy final ke Vercel production dengan `AI_PROVIDER=mock`.
- **Selesai jika:** seluruh alur 3 role berjalan mulus di production tanpa error. *(Status: SELESAI)*

---

## Fase 7 (Opsional & Penyempurnaan Sistem)
- [x] Bulk action Queue Admin (`/admin/queue` verifikasi massal).
- [x] Rating / feedback perbaikan oleh warga di Detail Riwayat Laporan (`/pelapor/riwayat/[id]`).
- [x] Peta sebaran & statistik publik terbuka tanpa wajib login (`/statistik` + tautan Navbar & Footer).
- [x] Deteksi otomatis potensi duplikat laporan di Queue Admin radius < 50 meter (`lib/utils/geo-distance.ts`).
- [x] Konfigurasi bobot algoritma prioritas dinamis (w1, w2, w3) + Live Simulator di `/admin/pengaturan`.
- [x] Verifikasi build production dan typecheck (`npx tsc --noEmit` & `npm run build` sukses 100%).
- **Status:** Seluruh fitur Fase 0 hingga Fase 7 telah selesai diimplementasikan dan diverifikasi secara menyeluruh. *(SELESAI)*

---

## Fase UI/UX Audit Implementation (Approved Report)
- [x] **Phase 1.1:** Pelapor Mobile Bottom Navigation (`PelaporLayoutWrapper.tsx`, header & bottom bar fixed, safe padding).
- [x] **Phase 1.2:** Refactor SeverityBadge (`components/shared/SeverityBadge.tsx` 100% semantic Tailwind design tokens).
- [x] **Phase 1.3:** Refactor StatusBadge (`components/shared/StatusBadge.tsx` 100% semantic Tailwind design tokens).
- [x] **Phase 1.4:** Admin Queue Mobile View (`app/(admin)/admin/queue/page.tsx` responsive card/list view `< md:` & zero horizontal scroll).
- [x] **Phase 2.5:** Interactive Leaflet Map di LocationPicker (`components/forms/LeafletMapView.tsx` draggable pin, dynamic client-only import).
- [x] **Phase 2.6:** Desktop Form Lapor 2-Column (`app/(pelapor)/pelapor/lapor/page.tsx` seimbang di `lg:`, multi-step stepper di mobile).
- [x] **Phase 2.7:** Bounding Box Calibration (`components/shared/ImageBoundingBox.tsx` letterbox & aspect ratio calibration tanpa distorsi koordinat).
- [x] **Phase 2.8:** Mobile Sticky Action & Rejection Dialog (`app/(admin)/admin/queue/[id]/page.tsx` Dialog tolak laporan & sticky CTA mobile).
- [x] **Phase 3.9:** Form Lapor Progress Indicator (4 segmen visual progress bar di mobile Form Lapor).
- [x] **Phase 3.10:** Before / After Comparison (`app/(pelapor)/pelapor/riwayat/[id]/page.tsx` komparasi berdampingan foto warga vs foto bukti petugas).
- [x] **Phase 3.11:** Accessibility & Touch Target Polish (touch targets $\ge 44$px, ARIA labels pada icon-only buttons).
- **Status:** Seluruh rekomendasi UI/UX Audit Phase 1, 2, dan 3 telah diimplementasikan, lolos `npx tsc --noEmit`, `npm run lint`, dan lolos `npm run build` 100%. *(SELESAI)*

