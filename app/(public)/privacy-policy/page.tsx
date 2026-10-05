import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ruasLogo from "@/ruas-logo.png";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-base flex flex-col">
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-base/95 backdrop-blur-md shadow-subtle">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-12 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-90 shrink-0">
            <Image
              src={ruasLogo}
              alt="RUAS — Sistem Prioritas Jalan"
              priority
              className="h-6 sm:h-7 md:h-8 lg:h-9 w-auto object-contain"
            />
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs font-semibold">
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 py-12 px-6">
        <article className="max-w-[800px] mx-auto prose prose-slate">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Kebijakan Privasi RUAS
          </h1>
          <p className="text-xs text-text-secondary mb-8">
            Terakhir diperbarui: {new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}
          </p>

          <div className="space-y-6 text-sm text-text-secondary leading-relaxed">
            <section>
              <h2 className="text-lg font-bold text-text-primary mb-2">1. Pendahuluan</h2>
              <p>
                Platform RUAS menghargai privasi setiap pengguna. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan melindungi informasi pribadi yang Anda berikan saat menggunakan sistem pelaporan dan prioritas perbaikan jalan RUAS.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-text-primary mb-2">2. Data yang Kami Kumpulkan</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Data Akun:</strong> Nama lengkap, alamat email, nomor kontak, serta NIP dan instansi (khusus Admin Dinas).</li>
                <li><strong>Data Laporan:</strong> Foto kerusakan jalan yang diunggah, deskripsi opsional, serta koordinat geografis (lintang dan bujur GPS).</li>
                <li><strong>Data Log:</strong> Riwayat perubahan status laporan dan aktivitas tindak lanjut tugas.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-text-primary mb-2">3. Tujuan Penggunaan Data</h2>
              <p>
                Informasi yang dikumpulkan hanya digunakan untuk keperluan verifikasi teknis kerusakan jalan, penghitungan skor keparahan dan prioritas oleh dinas terkait, koordinasi penugasan tim lapangan, serta pembaruan status pengerjaan kepada pelapor.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-text-primary mb-2">4. Keamanan Data</h2>
              <p>
                Seluruh transmisi data dilindungi enkripsi standar industri. Kami menerapkan Row-Level Security (RLS) pada tingkat database untuk memastikan setiap pengguna hanya mengakses data yang sesuai dengan hak kewenangannya.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-text-primary mb-2">5. Kontak</h2>
              <p>
                Untuk pertanyaan mengenai kebijakan privasi ini, Anda dapat menghubungi sekretariat dinas pengelola platform RUAS setempat.
              </p>
            </section>
          </div>
        </article>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-text-secondary">
        © {new Date().getFullYear()} RUAS. Hak Cipta Dilindungi.
      </footer>
    </div>
  );
}
