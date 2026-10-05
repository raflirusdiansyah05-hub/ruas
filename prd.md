# PRD.md — RUAS

> Product Requirements Document. Ini adalah dokumen pertama yang WAJIB dibaca oleh siapa pun (manusia atau AI agent) yang bekerja di proyek ini. Untuk detail teknis implementasi, lihat `techstack.md`. Untuk aturan visual, lihat `design.md`. Untuk aturan kerja AI coding agent, lihat `agent.md`.

---

## 📌 Changelog Update Terbaru (Round 3)

- **Bagian 5.4** — Hosting ML service **dikembalikan ke Render** (Hugging Face Spaces sekarang mewajibkan paid plan untuk Docker — lihat `techstack.md` Bagian 4.5 untuk detail). Model tetap **YOLO26 (`yolo26n.pt`)**.

## 📌 Changelog Round 2 (riwayat — hosting-nya sudah dibalik lagi di Round 3)

- **Bagian 5.4** — Model AI diganti jadi **YOLO26 (`yolo26n.pt`)** — ini tetap berlaku. ~~hosting ML service diganti ke Hugging Face Spaces~~ — dibatalkan di Round 3.

## 📌 Changelog Round 1 (riwayat)

Mengikuti finalisasi Priority/Severity & aktivasi model AI asli. Bagian yang berubah:

- **Bagian 5.1** — Fitur "Lapor kerusakan": tambah tagging **Fungsi Jalan**. Fitur "Lihat hasil deteksi instan": severity → **priority score**.
- **Bagian 5.2** — Fitur Queue: tambah toggle sort "Terlama Menunggu"; tambah fitur baru **indikator "⚠ Menunggu X hari"**.
- **Bagian 5.4** — deskripsi fitur scoring diperbarui, model AI ditandai sudah tersedia (bukan lagi rencana).

---

## 1. Problem Statement

Instansi pengelola jalan (Dinas PU/Bina Marga, pemda) menerima laporan kerusakan jalan dalam volume besar dari berbagai sumber (aplikasi pengaduan, media sosial, survei manual), namun proses verifikasi dan penentuan prioritas perbaikan masih dilakukan secara manual — lambat, tidak konsisten antar-petugas, dan rawan bias. Jalan yang lebih "terlihat" atau viral di media sosial cenderung lebih cepat ditangani dibanding jalan yang secara objektif lebih rusak tapi sepi laporan.

Akibatnya, anggaran perbaikan jalan sering tidak jatuh ke titik yang paling membutuhkan. Di sisi lain, warga tidak memiliki cara mudah untuk melaporkan kerusakan tanpa harus memahami istilah teknis, dan tidak mendapat kepastian/transparansi soal tindak lanjut laporan mereka.

**RUAS** hadir sebagai sistem decision-support yang mengubah foto kerusakan jalan menjadi rekomendasi prioritas perbaikan yang transparan, konsisten, dan bisa dipertanggungjawabkan secara data — menjembatani warga (pelapor), sistem deteksi otomatis (AI), dan pengambil keputusan (Dinas) dalam satu alur digital.

---

## 2. Goals

### 2.1 Tujuan Utama
1. Mempercepat proses verifikasi dan penentuan prioritas perbaikan jalan dibanding proses manual.
2. Menghilangkan bias subjektif dalam penentuan prioritas, dengan skema scoring yang transparan dan bisa diaudit (bukan black box).
3. Memberi warga saluran pelaporan yang mudah digunakan tanpa perlu pengetahuan teknis kerusakan jalan.
4. Memberi Dinas alat kerja (bukan sekadar penampung data) — dari verifikasi, penugasan petugas, sampai pelacakan penyelesaian.

### 2.2 Metrik / KPI Keberhasilan

| Metrik | Target Awal (Estimasi/Asumsi) |
|---|---|
| Waktu rata-rata dari laporan masuk → terverifikasi Admin | < 2 hari (dibanding proses manual yang bisa berminggu-minggu) |
| Persentase laporan dengan severity `critical`/`high` yang diverifikasi dalam 24 jam | ≥ 80% |
| Tingkat penyelesaian laporan (status `selesai` / total laporan terverifikasi) dalam 30 hari | ≥ 60% |
| Akurasi klasifikasi jenis kerusakan (setelah model AI asli terpasang, bukan mock) | Diukur via mAP@50 — target ditentukan saat fase evaluasi model |
| Kepuasan transparansi (Admin memahami dasar priority score tanpa bantuan tambahan) | Diukur via feedback kualitatif, bukan angka di fase awal |

> Catatan: Target di atas adalah estimasi awal untuk fase prototype/MVP, bukan SLA final — akan dikalibrasi ulang setelah data penggunaan riil tersedia.

---

## 3. Target Users

### Persona 1 — Pelapor (Warga)
- **Siapa:** Warga umum dari berbagai usia dan latar belakang teknologi, termasuk yang awam istilah teknis jalan.
- **Kebutuhan:** Cara cepat & mudah melaporkan kerusakan jalan cukup lewat foto, tanpa perlu mengisi form rumit atau memahami klasifikasi kerusakan.
- **Konteks penggunaan:** Mayoritas mengakses lewat smartphone, sering dalam kondisi bergerak/di lokasi kejadian, kadang dengan koneksi internet terbatas.

### Persona 2 — Admin Dinas (Penerima Laporan)
- **Siapa:** Staf Dinas PU/Bina Marga atau pemda yang bertanggung jawab memverifikasi laporan dan mengambil keputusan alokasi perbaikan.
- **Kebutuhan:** Dashboard yang menyajikan laporan terprioritas secara objektif, alat verifikasi cepat, dan kemampuan menugaskan pekerjaan ke tim lapangan.
- **Konteks penggunaan:** Bekerja dari kantor/desktop, butuh tampilan data-dense namun tetap scannable.

### Persona 3 — Petugas Lapangan
- **Siapa:** Tim teknis yang ditugaskan Admin untuk mengerjakan perbaikan di lokasi.
- **Kebutuhan:** Daftar tugas yang jelas, navigasi cepat ke lokasi, cara mudah melaporkan pekerjaan selesai dengan bukti foto.
- **Konteks penggunaan:** Mayoritas di lapangan/jalan, mengakses lewat smartphone.

---

## 4. User Stories

### Pelapor
- Sebagai **Pelapor**, saya ingin **melaporkan kerusakan jalan cukup dengan foto dan lokasi otomatis**, agar **saya tidak perlu memahami istilah teknis jenis kerusakan**.
- Sebagai **Pelapor**, saya ingin **melihat hasil deteksi dan tingkat keparahan segera setelah melapor**, agar **saya yakin laporan saya diproses, bukan hilang begitu saja**.
- Sebagai **Pelapor**, saya ingin **melacak status laporan saya dari waktu ke waktu**, agar **saya tahu kapan laporan saya akan ditindaklanjuti**.
- Sebagai **Pelapor**, saya ingin **menerima notifikasi saat status laporan saya berubah**, agar **saya tidak perlu mengecek aplikasi berulang kali**.

### Admin Dinas
- Sebagai **Admin Dinas**, saya ingin **melihat laporan terurut berdasarkan skor prioritas**, agar **saya bisa fokus menangani kerusakan paling mendesak terlebih dahulu**.
- Sebagai **Admin Dinas**, saya ingin **melihat rincian bagaimana skor prioritas dihitung**, agar **saya bisa mempertanggungjawabkan keputusan saya ke atasan atau publik**.
- Sebagai **Admin Dinas**, saya ingin **menugaskan laporan terverifikasi ke petugas tertentu berdasarkan wilayah**, agar **pekerjaan terdistribusi secara efisien**.
- Sebagai **Admin Dinas**, saya ingin **melihat analitik agregat (jenis kerusakan terbanyak, wilayah rawan)**, agar **saya bisa merencanakan alokasi anggaran jangka panjang**.

### Petugas Lapangan
- Sebagai **Petugas Lapangan**, saya ingin **melihat daftar tugas yang ditugaskan ke saya beserta lokasinya**, agar **saya bisa merencanakan rute kerja harian**.
- Sebagai **Petugas Lapangan**, saya ingin **mengunggah foto bukti setelah pekerjaan selesai**, agar **ada catatan akuntabilitas yang jelas**.

---

## 5. Functional Requirements

Fitur dikelompokkan per role dengan prioritas **WAJIB** (harus ada di MVP) atau **NICE-TO-HAVE** (dikerjakan jika waktu tersisa). Detail alur teknis tiap fitur ada di `techstack.md` Bagian 4 (Program Execution Breakdown).

### 5.1 Fitur Pelapor
| Fitur | Prioritas |
|---|---|
| Registrasi & Login (+ verifikasi OTP email) | WAJIB |
| Lupa/Reset Password | WAJIB |
| Lapor kerusakan (foto + lokasi GPS otomatis + tagging Fungsi Jalan [Arteri/Kolektor/Lokal/Lingkungan] + deskripsi opsional) | WAJIB |
| Lihat hasil deteksi instan setelah submit (jenis kerusakan + priority score) | WAJIB |
| Riwayat laporan pribadi + filter status | WAJIB |
| Detail & tracking status laporan (timeline) | WAJIB |
| Kelola profil (data diri, ubah password) | WAJIB |
| Notifikasi status laporan (in-app) | WAJIB |
| Lacak laporan pribadi di peta | NICE-TO-HAVE |
| Rating/feedback hasil perbaikan | NICE-TO-HAVE |
| Auto-flag laporan duplikat (lokasi+waktu mirip) | NICE-TO-HAVE |

### 5.2 Fitur Admin Dinas
| Fitur | Prioritas |
|---|---|
| Registrasi dengan verifikasi NIP+Instansi otomatis | WAJIB |
| Dashboard ringkasan (statistik + peta sebaran + tren) | WAJIB |
| Queue laporan terprioritas (sort otomatis by priority score; toggle ke "Terlama Menunggu" by tanggal lapor) | WAJIB |
| Indikator laporan menunggu lama ("⚠ Menunggu X hari") di Queue & Detail Laporan | WAJIB |
| Verifikasi/tolak laporan (dengan alasan) | WAJIB |
| Lihat breakdown skor AI secara transparan | WAJIB |
| Assign laporan ke petugas lapangan | WAJIB |
| Catatan internal per laporan | WAJIB |
| Manajemen akun petugas (invite by email) | WAJIB |
| Laporan & analitik + export CSV | WAJIB |
| Notifikasi laporan baru/urgent (in-app) | WAJIB |
| Bulk action (verifikasi massal) | NICE-TO-HAVE |
| Deteksi duplikat manual (highlight laporan berdekatan) | NICE-TO-HAVE |
| Pengaturan threshold scoring | NICE-TO-HAVE |

### 5.3 Fitur Petugas Lapangan
| Fitur | Prioritas |
|---|---|
| Aktivasi akun via undangan (bukan self-register) | WAJIB |
| Lihat tugas yang di-assign, sort by urgensi | WAJIB |
| Update status tugas (mulai kerjakan → selesai) | WAJIB |
| Upload bukti foto perbaikan (wajib saat menandai selesai) | WAJIB |
| Navigasi ke lokasi (link Google Maps) | WAJIB |
| Riwayat tugas (before-after) | WAJIB |
| Notifikasi tugas baru (in-app) | WAJIB |

### 5.4 Fitur Lintas-Sistem
| Fitur | Prioritas |
|---|---|
| Sistem notifikasi in-app untuk semua role | WAJIB |
| Kompresi foto sebelum upload | WAJIB |
| Halaman Kebijakan Privasi & Syarat Ketentuan | WAJIB |
| Keamanan data (Row-Level Security, validasi input) | WAJIB |
| Validasi ukuran & format upload foto | WAJIB |
| Perhitungan severity & priority score (rule-based, transparan — `S_norm` + Exposure Fungsi Jalan, lihat `techstack.md` Bagian 4.3) | WAJIB |
| Deteksi kerusakan via model AI asli (YOLO26, FastAPI terpisah di Render) | WAJIB |
| Notifikasi via WhatsApp/Email (tambahan di luar in-app) | NICE-TO-HAVE |
| Statistik publik (heatmap tanpa login) | NICE-TO-HAVE |
| Mode offline-lite / retry upload otomatis | NICE-TO-HAVE |

---

## 6. Non-Functional Requirements

| Kategori | Requirement |
|---|---|
| **Performa** | Halaman utama harus dapat dimuat < 3 detik pada koneksi 4G standar. Foto dikompresi di sisi client ke maksimal ~1MB sebelum diunggah ke storage; foto yang dikirim ke model AI di-resize terpisah ke 640×640px (📌 lihat `techstack.md` Bagian 4.4–4.5) agar ukuran payload ke FastAPI tetap kecil. Respons API untuk operasi CRUD standar ditargetkan < 500ms (di luar waktu proses AI, yang bisa lebih lambat saat cold-start service Render). |
| **Keamanan** | Seluruh akses data WAJIB dibatasi lewat Row-Level Security (RLS) di database — bukan hanya validasi di sisi aplikasi. Password tidak pernah disimpan/ditangani manual (didelegasikan penuh ke Supabase Auth). Endpoint sensitif (invite petugas, verifikasi NIP) hanya bisa dipanggil dari server, tidak boleh expose service role key ke client. |
| **Skalabilitas** | Desain awal ditargetkan untuk skala kota/kabupaten (ribuan laporan per bulan), bukan skala nasional. Arsitektur serverless (Vercel + Supabase) dipilih agar bisa scale otomatis tanpa manajemen infrastruktur manual di fase awal. |
| **Ketersediaan (Uptime)** | Mengandalkan SLA bawaan platform hosting (Vercel & Supabase) — tidak ada target uptime custom tambahan di fase MVP. |
| **Aksesibilitas** | Elemen interaktif minimal 44px touch target di mobile. Warna (severity/status) tidak boleh jadi satu-satunya penanda informasi — selalu disertai label teks. |
| **Privasi Data** | Data lokasi, foto, dan data pribadi (termasuk NIP untuk Admin) tunduk pada Kebijakan Privasi yang wajib ditampilkan dan disetujui saat registrasi. |
| **Kompatibilitas** | Wajib berjalan baik di browser mobile modern (Chrome/Safari versi 2 tahun terakhir) dan resolusi layar mulai dari 360px lebar. |

---

## 7. Scope

### 7.1 Dalam Cakupan (In-Scope) — Fase MVP
- Seluruh fitur berlabel **WAJIB** di Bagian 5.
- 3 role pengguna: Pelapor, Admin Dinas, Petugas Lapangan.
- Sistem AI deteksi kerusakan dalam bentuk **Mock Provider** (model asli belum tersedia — lihat `techstack.md` Bagian 4.5 untuk mekanisme plug-and-play saat model asli siap).
- Web application responsive (mobile & desktop), bukan aplikasi native.

### 7.2 Di Luar Cakupan (Out-of-Scope) — Fase MVP
- Aplikasi mobile native (Android/iOS terpisah).
- Integrasi nyata ke database ASN/kepegawaian (SIMPEG/BKN) — digunakan tabel referensi simulasi (lihat `techstack.md`).
- Sistem pembayaran atau manajemen anggaran.
- Fitur chat real-time antar pelapor-admin-petugas (cukup notifikasi status).
- Seluruh fitur berlabel **NICE-TO-HAVE** di Bagian 5, kecuali ada waktu pengembangan tersisa.

---

## 8. Alur Sistem (High-Level)

Dari sudut pandang pengguna, alur inti sistem adalah sebagai berikut. Detail teknis (endpoint, query database, urutan komputasi) ada di `techstack.md` Bagian 3 (Detailed Program Flow Diagram) dan Bagian 4 (Program Execution Breakdown).

```
1. Pelapor memotret kerusakan jalan → mengirim laporan lewat aplikasi
2. Sistem AI mendeteksi jenis kerusakan & menghitung tingkat keparahan
3. Laporan otomatis masuk ke antrian Admin Dinas, terurut dari yang paling mendesak
4. Admin memverifikasi laporan (menerima atau menolak) berdasarkan data yang disajikan
5. Admin menugaskan laporan yang valid ke Petugas Lapangan sesuai wilayah
6. Petugas mengerjakan perbaikan di lokasi, lalu mengunggah bukti foto setelah selesai
7. Pelapor melihat status laporannya berubah menjadi "Selesai", lengkap dengan riwayat prosesnya
```

Prinsip yang dipegang: setiap keputusan otomatis dari sistem (severity, priority score) bersifat **rekomendasi yang transparan**, bukan keputusan final — keputusan akhir tetap berada di tangan Admin Dinas (human-in-the-loop).
