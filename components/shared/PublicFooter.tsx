"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import ruasLogo from "@/ruas-logo.png";

export function PublicFooter() {
  const pathname = usePathname();
  const isLandingPage = pathname === "/";

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    if (isLandingPage) {
      e.preventDefault();
      const element = document.getElementById(targetId);
      if (element) {
        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        element.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "start",
        });
        window.history.pushState(null, "", `#${targetId}`);
      }
    }
  };

  return (
    <footer className="bg-surface border-t border-border/80 py-8 sm:py-9 md:py-10">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        {/* Main 3 Columns Layout (Desktop) / Stacked (Mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 lg:gap-10">
          {/* Kolom 1 — Brand RUAS */}
          <div className="md:col-span-5 lg:col-span-5 flex flex-col items-start gap-2.5 sm:gap-3">
            <Link
              href="/"
              className="inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
            >
              <Image
                src={ruasLogo}
                alt="RUAS — Sistem Prioritas Jalan"
                className="h-7 sm:h-8 w-auto object-contain"
                priority={false}
              />
            </Link>
            <p className="text-xs sm:text-sm text-slate-600 text-[#475569] leading-relaxed max-w-sm">
              Sistem decision-support transparansi prioritas dan pelaporan perbaikan jalan yang menghubungkan warga, dinas, dan petugas lapangan secara objektif berbasis data.
            </p>
          </div>

          {/* Kolom 2 — Navigasi Cepat (Strictly 3 Items) */}
          <div className="md:col-span-3 lg:col-span-3 flex flex-col items-start gap-2.5 sm:gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 text-[#0F172A]">
              NAVIGASI CEPAT
            </h4>
            <nav className="flex flex-col space-y-1.5 sm:space-y-2">
              <Link
                href="/#cara-kerja"
                onClick={(e) => handleNavClick(e, "cara-kerja")}
                className="text-xs sm:text-sm text-slate-600 text-[#475569] hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded py-0.5"
              >
                Bagaimana RUAS Bekerja
              </Link>
              <Link
                href="/#tiga-peran"
                onClick={(e) => handleNavClick(e, "tiga-peran")}
                className="text-xs sm:text-sm text-slate-600 text-[#475569] hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded py-0.5"
              >
                Dirancang untuk Tiga Peran Utama
              </Link>
              <Link
                href="/#faq"
                onClick={(e) => handleNavClick(e, "faq")}
                className="text-xs sm:text-sm text-slate-600 text-[#475569] hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded py-0.5"
              >
                Pertanyaan yang Sering Diajukan
              </Link>
            </nav>
          </div>

          {/* Kolom 3 — Transparansi */}
          <div className="md:col-span-4 lg:col-span-4 flex flex-col items-start gap-2.5 sm:gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 text-[#0F172A]">
              TRANSPARANSI
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 text-[#475569] leading-relaxed">
              Setiap laporan kerusakan diverifikasi dengan skema scoring terbuka tanpa bias subjektif. Rekomendasi prioritas dan progres perbaikan fisik dapat dipantau bersama untuk akuntabilitas publik.
            </p>
          </div>
        </div>

        {/* Divider Horizontal */}
        <div className="border-t border-border/80 mt-6 sm:mt-8 pt-4 sm:pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs text-slate-500 text-[#64748B]">
          {/* Copyright Kiri */}
          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} RUAS — Sistem Prioritas & Pelaporan Perbaikan Jalan.
          </p>

          {/* Legal Links Kanan */}
          <div className="flex items-center gap-4 sm:gap-6">
            <Link
              href="/privacy-policy"
              className="hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            >
              Kebijakan Privasi
            </Link>
            <span className="text-border select-none" aria-hidden="true">|</span>
            <Link
              href="/terms"
              className="hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            >
              Syarat & Ketentuan
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
