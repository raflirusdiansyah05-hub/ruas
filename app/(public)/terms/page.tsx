import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ruasLogo from "@/ruas-logo.png";

export default function TermsPage() {
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
            Syarat & Ketentuan Penggunaan RUAS
          </h1>
          <p className="text-xs text-text-secondary mb-8">
            Terakhir diperbarui: {new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}
          </p>

          <div className="space-y-6 text-sm text-text-secondary leading-relaxed">
            <section>
              <h2 className="text-lg font-bold text-text-primary mb-2">1. Ketentuan Umum</h2>
              <p>
                Dengan mengakses dan menggunakan sistem RUAS, Anda menyatakan bahwa Anda setuju untuk terikat oleh Syarat dan Ketentuan ini. RUAS adalah platform sistem pendukung keputusan (decision-support system) yang memfasilitasi transparansi dan efektivitas perbaikan jalan umum.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-text-primary mb-2">2. Kewajiban Pelapor</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Pelapor wajib menyampaikan foto asli dan lokasi riil dari kerusakan jalan di lapangan.</li>
                <li>Dilarang mengunggah konten palsu, menyesatkan, mengandung unsur SARA, atau pornografi.</li>
                <li>Laporan yang terbukti fiktif atau duplikasi yang disengaja dapat ditolak oleh verifikator dinas.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-text-primary mb-2">3. Sifat Rekomendasi AI & Pengambilan Keputusan</h2>
              <p>
                Hasil analisis jenis kerusakan dan skor keparahan yang dihasilkan oleh AI bersifat sebagai rekomendasi objektif. Keputusan akhir verifikasi, penerimaan, penjadwalan, dan alokasi perbaikan fisik sepenuhnya berada di bawah kewenangan resmi instansi Dinas PU/Bina Marga setempat.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-text-primary mb-2">4. Tanggung Jawab Akun</h2>
              <p>
                Pengguna bertanggung jawab menjaga kerahasiaan kata sandi akun masing-masing. Penyalahgunaan akun dinas atau petugas lapangan yang mengakibatkan manipulasi data publik akan diproses sesuai peraturan kepegawaian dan hukum yang berlaku.
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
