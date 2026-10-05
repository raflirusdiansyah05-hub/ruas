-- seed.sql — RUAS Seed Data
-- Minimal 5 data dummy instansi_referensi untuk simulasi verifikasi NIP+Instansi Admin

insert into public.instansi_referensi (nip, nama_pegawai, instansi, is_active)
values
  ('198501012010011001', 'Ir. Budi Santoso, M.T.', 'Dinas Bina Marga dan Penataan Ruang', true),
  ('198803152012022002', 'Siti Rahmawati, S.T.', 'Dinas Pekerjaan Umum dan Perumahan Rakyat', true),
  ('199007202015031003', 'Ahmad Fauzi, S.T.', 'Dinas Pekerjaan Umum Kota', true),
  ('199211102018012004', 'Dewi Lestari, S.T.', 'Dinas Bina Marga Provinsi', true),
  ('198205042008011005', 'Hendra Kusuma, M.Eng.', 'Dinas Perhubungan dan Prasarana Jalan', true),
  ('199501012020121006', 'Pegawai Non-Aktif', 'Dinas Bina Marga dan Penataan Ruang', false)
on conflict (nip) do nothing;
