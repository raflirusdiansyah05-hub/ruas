"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Camera,
  Cpu,
  CheckCircle2,
  FileCheck2,
  TrendingUp,
  Clock,
  Mail,
  GraduationCap,
} from "lucide-react";
import ruasLogo from "@/ruas-logo.png";
import ruasHeroIcon from "@/ruas-hero-icon.png";
import anggota1Img from "@/anggota 1.png";
import anggota2Img from "@/anggota 2.png";
import anggota3Img from "@/anggota 3.png";
import { PublicFooter } from "@/components/shared/PublicFooter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-base text-slate-900 text-[#0F172A] flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* 1. NAVBAR */}
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
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/statistik"
              className="text-xs sm:text-sm font-medium text-slate-600 text-[#475569] hover:text-primary transition-colors px-2 sm:px-3 py-1.5 rounded-lg hover:bg-surface whitespace-nowrap"
            >
              Statistik Publik
            </Link>
            <Button asChild variant="outline" className="h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm font-semibold rounded-lg text-slate-900 text-[#0F172A] border-border bg-base hover:bg-surface-hover hover:text-primary shadow-subtle">
              <Link href="/login">Masuk</Link>
            </Button>
            <Button asChild variant="default" className="hidden sm:inline-flex h-8.5 sm:h-9 px-4 sm:px-5 text-xs sm:text-sm font-bold shadow-card rounded-lg">
              <Link href="/sign-up">Lapor Sekarang</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* 2. HERO SECTION */}
        <section className="relative overflow-hidden pt-10 pb-16 md:pt-16 md:pb-24 bg-base border-b border-border/70">
          <div className="max-w-[1280px] mx-auto px-6 md:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* Kolom Kiri: Teks & CTA */}
              <div className="lg:col-span-7 flex flex-col text-center lg:text-left">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-black text-slate-900 text-[#0F172A] tracking-tight leading-[1.12] mb-6">
                  Foto Kerusakan Jalan, Kami Hitung Prioritas Penanganannya
                </h1>
                <p className="text-base sm:text-lg text-slate-600 text-[#475569] leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0 font-normal">
                  RUAS menghubungkan laporan warga dengan verifikasi otomatis AI dan sistem prioritas objektif bagi dinas terkait — transparan, akuntabel, dan tepat sasaran.
                </p>
                <div className="flex flex-col sm:flex-row gap-3.5 justify-center lg:justify-start w-full">
                  <Button asChild size="lg" className="w-full sm:w-auto gap-2.5 shadow-card font-bold h-12 px-7 text-sm sm:text-base rounded-xl">
                    <Link href="/sign-up">
                      <Camera className="h-5 w-5" />
                      Lapor Kerusakan Jalan
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="w-full sm:w-auto font-semibold h-12 px-7 text-sm sm:text-base rounded-xl text-slate-900 text-[#0F172A] border-border bg-base hover:bg-surface-hover hover:text-primary transition-colors shadow-subtle">
                    <Link href="#cara-kerja" className="text-slate-900 text-[#0F172A] hover:text-primary">
                      Pelajari Alur Kerja
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Kolom Kanan: Standalone Hero Icon */}
              <div className="lg:col-span-5 flex justify-center items-center">
                <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 lg:w-[440px] lg:h-[440px] flex items-center justify-center">
                  <Image
                    src={ruasHeroIcon}
                    alt="RUAS Maskot Kerucut Jalan"
                    fill
                    sizes="(max-width: 768px) 320px, (max-width: 1024px) 384px, 440px"
                    className="object-contain drop-shadow-md"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. CARA KERJA */}
        <section id="cara-kerja" className="scroll-mt-14 sm:scroll-mt-16 py-16 md:py-24 border-b border-border/80 bg-surface/60">
          <div className="max-w-[1280px] mx-auto px-6 md:px-12">
            <div className="text-center max-w-2xl mx-auto mb-14 md:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 text-[#0F172A] tracking-tight mb-3">
                Bagaimana RUAS Bekerja
              </h2>
              <p className="text-slate-600 text-[#475569] text-sm md:text-base leading-relaxed">
                Dari foto warga di jalan hingga bukti fisik perbaikan oleh petugas lapangan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
              {[
                {
                  step: "01",
                  title: "Ambil Foto & Lokasi",
                  desc: "Warga cukup memotret jalan rusak. Lokasi GPS otomatis tersemat tanpa perlu mengetik alamat manual.",
                  icon: Camera,
                },
                {
                  step: "02",
                  title: "Analisis Otomatis AI",
                  desc: "Sistem mendeteksi jenis kerusakan (lubang, retak buaya) serta menghitung severity score secara transparan.",
                  icon: Cpu,
                },
                {
                  step: "03",
                  title: "Prioritas & Verifikasi",
                  desc: "Admin dinas menerima laporan terurut dari yang paling mendesak, memverifikasi, lalu menugaskan petugas.",
                  icon: FileCheck2,
                },
                {
                  step: "04",
                  title: "Pengerjaan & Bukti",
                  desc: "Petugas ke lokasi, memperbaiki jalan, dan mengunggah foto bukti pengerjaan. Status laporan selesai.",
                  icon: CheckCircle2,
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="group relative flex flex-col justify-between p-6 sm:p-7 rounded-2xl bg-base border border-border/80 hover:border-primary/40 hover:shadow-card-hover transition-all duration-200"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <span className="text-2xl font-black text-primary/40 font-mono tracking-tight group-hover:text-primary transition-colors">
                        {item.step}
                      </span>
                      <div className="h-11 w-11 rounded-xl bg-primary-soft text-primary flex items-center justify-center border border-primary/15 shadow-subtle group-hover:bg-primary group-hover:text-white transition-colors">
                        <item.icon className="h-5 w-5" />
                      </div>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 text-[#0F172A] mb-2 tracking-tight">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 text-[#475569] leading-relaxed font-normal">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. TIGA ROLE PENGGUNA */}
        <section id="tiga-peran" className="scroll-mt-14 sm:scroll-mt-16 py-16 md:py-24 bg-base border-b border-border/80">
          <div className="max-w-[1280px] mx-auto px-6 md:px-12">
            <div className="text-center max-w-2xl mx-auto mb-14 md:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 text-[#0F172A] tracking-tight mb-3">
                Dirancang untuk Tiga Peran Utama
              </h2>
              <p className="text-slate-600 text-[#475569] text-sm md:text-base leading-relaxed">
                Menghubungkan warga, pengambil keputusan di dinas, dan teknisi lapangan dalam satu platform terpadu.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              <Card className="hover:shadow-card-hover transition-all duration-200 border-border/80 bg-surface/40 hover:bg-base rounded-2xl">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-center justify-between mb-5">
                    <div className="h-12 w-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-card border border-primary/20">
                      <Camera className="h-6 w-6" />
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary-soft text-primary border border-primary/20">
                      Publik
                    </span>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-slate-900 text-[#0F172A] mb-2 tracking-tight">
                    Warga (Pelapor)
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 text-[#475569] leading-relaxed mb-6">
                    Melaporkan jalan rusak dalam hitungan detik tanpa memahami istilah teknis perkerasan jalan.
                  </p>
                  <ul className="text-xs text-slate-600 text-[#475569] space-y-3 pt-5 border-t border-border/70">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>Deteksi instan jenis kerusakan via AI</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>Pelacakan status pengerjaan transparan</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="hover:shadow-card-hover transition-all duration-200 border-border/80 bg-surface/40 hover:bg-base rounded-2xl">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-center justify-between mb-5">
                    <div className="h-12 w-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-card border border-primary/20">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      Pemerintah
                    </span>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-slate-900 text-[#0F172A] mb-2 tracking-tight">
                    Admin Dinas PU
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 text-[#475569] leading-relaxed mb-6">
                    Decision-support dashboard dengan antrean laporan yang telah diskor objektif berdasarkan urgensi.
                  </p>
                  <ul className="text-xs text-slate-600 text-[#475569] space-y-3 pt-5 border-t border-border/70">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>Verifikasi antrean prioritas berbasis data</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>Penugasan instan ke tim teknis lapangan</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="hover:shadow-card-hover transition-all duration-200 border-border/80 bg-surface/40 hover:bg-base rounded-2xl">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-center justify-between mb-5">
                    <div className="h-12 w-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-card border border-primary/20">
                      <Clock className="h-6 w-6" />
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      Lapangan
                    </span>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-slate-900 text-[#0F172A] mb-2 tracking-tight">
                    Petugas Lapangan
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 text-[#475569] leading-relaxed mb-6">
                    Menerima instruksi perbaikan jalan beserta koordinat presisi langsung di smartphone mereka.
                  </p>
                  <ul className="text-xs text-slate-600 text-[#475569] space-y-3 pt-5 border-t border-border/70">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>Navigasi langsung ke titik kerusakan</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>Unggah bukti foto hasil penyelesaian</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* 5. FAQ */}
        <section id="faq" className="scroll-mt-14 sm:scroll-mt-16 py-16 md:py-24 bg-surface/60 border-b border-border/80">
          <div className="max-w-[800px] mx-auto px-6 md:px-12">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 text-[#0F172A] tracking-tight mb-3">
                Pertanyaan yang Sering Diajukan
              </h2>
              <p className="text-slate-600 text-[#475569] text-sm md:text-base leading-relaxed">
                Informasi seputar penggunaan sistem pelaporan RUAS
              </p>
            </div>

            <Accordion type="single" collapsible className="w-full bg-base rounded-2xl border border-border/80 p-4 sm:p-6 shadow-subtle">
              <AccordionItem value="item-1" className="border-border/70">
                <AccordionTrigger className="text-sm sm:text-base font-semibold text-slate-900 text-[#0F172A] hover:text-primary py-4 hover:no-underline text-left">
                  Bagaimana skor prioritas dihitung?
                </AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm text-slate-600 text-[#475569] leading-relaxed pb-4 whitespace-pre-line">
                  {`Skor prioritas laporan dihitung menggunakan kombinasi antara tingkat keparahan kerusakan dan faktor urgensi. Rumus yang digunakan adalah:

Priority Score = (0.70 × Sₙₒᵣₘ) + (0.30 × E)

Dengan Sₙₒᵣₘ sebagai skor tingkat keparahan yang telah dinormalisasi dan E sebagai faktor urgensi. Semakin tinggi skor yang diperoleh, semakin tinggi prioritas laporan untuk ditangani.`}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border-border/70">
                <AccordionTrigger className="text-sm sm:text-base font-semibold text-slate-900 text-[#0F172A] hover:text-primary py-4 hover:no-underline text-left">
                  Mengapa data perlu dinormalisasi sebelum dilakukan perhitungan?
                </AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm text-slate-600 text-[#475569] leading-relaxed pb-4 whitespace-pre-line">
                  {`Normalisasi digunakan agar setiap variabel memiliki skala yang sebanding sehingga tidak ada satu variabel yang mendominasi perhitungan hanya karena memiliki rentang nilai yang lebih besar.

Salah satu metode yang dapat digunakan adalah Min-Max Normalization:

x' = (x - xₘᵢₙ) / (xₘₐₓ - xₘᵢₙ)

Hasil normalisasi berada pada rentang 0 sampai 1.`}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="border-border/70">
                <AccordionTrigger className="text-sm sm:text-base font-semibold text-slate-900 text-[#0F172A] hover:text-primary py-4 hover:no-underline text-left">
                  Apa itu clustering dalam Data Mining dan bagaimana penggunaannya pada data laporan jalan?
                </AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm text-slate-600 text-[#475569] leading-relaxed pb-4 whitespace-pre-line">
                  Clustering merupakan teknik Data Mining untuk mengelompokkan data berdasarkan kemiripan karakteristiknya. Pada sistem RUAS, clustering dapat digunakan untuk menemukan kelompok laporan jalan yang memiliki karakteristik kerusakan atau kondisi yang serupa tanpa harus menentukan kelompok tersebut secara manual sejak awal.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="border-none">
                <AccordionTrigger className="text-sm sm:text-base font-semibold text-slate-900 text-[#0F172A] hover:text-primary py-4 hover:no-underline text-left">
                  Bagaimana cara mengukur kemiripan atau jarak antar data?
                </AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm text-slate-600 text-[#475569] leading-relaxed pb-4 whitespace-pre-line">
                  {`Salah satu metode yang umum digunakan adalah Euclidean Distance. Rumusnya:

d(x,y) = √Σ(xᵢ - yᵢ)²

Semakin kecil nilai jaraknya, semakin mirip karakteristik kedua data.`}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* 6. TEAM SECTION (EDITORIAL SHOWCASE) */}
        <section className="py-16 md:py-24 bg-base border-b border-border/80">
          <div className="max-w-[1280px] mx-auto px-6 md:px-12">
            <div className="text-center max-w-2xl mx-auto mb-14 md:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 text-[#0F172A] tracking-tight mb-3">
                Tim di Balik RUAS
              </h2>
              <p className="text-slate-600 text-[#475569] text-sm md:text-base leading-relaxed">
                Dedikasi dan kolaborasi lintas disiplin untuk mewujudkan tata kelola infrastruktur jalan yang transparan, akuntabel, dan berbasis data.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 max-w-[1020px] mx-auto">
              {[
                {
                  name: "Muhammad Adib Ilman",
                  kelas: "3IA01",
                  prodi: "S1 Informatika",
                  email: "adibilmann0@gmail.com",
                  image: anggota1Img,
                },
                {
                  name: "Grasya",
                  kelas: "3KA10",
                  prodi: "S1 Sistem Informasi",
                  email: "grsyaaaka@gmail.com",
                  image: anggota2Img,
                },
                {
                  name: "Muhammad Rafli Rusdiansyah",
                  kelas: "3IA01",
                  prodi: "S1 Informatika",
                  email: "raflirusdiansyah05@gmail.com",
                  image: anggota3Img,
                },
              ].map((member, idx) => (
                <div key={idx} className="group flex flex-col items-center text-center">
                  <div className="relative w-full aspect-[2/3] max-w-[280px] rounded-2xl overflow-hidden border border-border/80 bg-surface shadow-subtle group-hover:shadow-card transition-all duration-300">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      sizes="(max-width: 768px) 280px, 300px"
                      className="object-cover object-center group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  </div>
                  <div className="mt-4 flex flex-col items-center">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 text-[#0F172A] tracking-tight">
                      {member.name}
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold text-primary text-[#1E8E5A] mt-1">
                      {member.kelas}
                    </p>
                    <p className="text-xs text-slate-600 text-[#475569] mt-0.5 flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5 text-slate-400 text-[#94A3B8] shrink-0" />
                      {member.prodi}
                    </p>
                    <a
                      href={`mailto:${member.email}`}
                      className="text-xs text-slate-500 text-[#94A3B8] mt-0.5 flex items-center gap-1.5 hover:text-primary transition-colors"
                    >
                      <Mail className="h-3.5 w-3.5 text-slate-400 text-[#94A3B8] shrink-0" />
                      {member.email}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* 7. FOOTER */}
      <PublicFooter />
    </div>
  );
}



