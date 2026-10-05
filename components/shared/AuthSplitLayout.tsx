import React from "react";
import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import ruasLogo from "@/ruas-logo.png";
import ruasHeroIcon from "@/ruas-hero-icon.png";

interface AuthSplitLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  heroIconSrc?: string | StaticImageData;
  heroIconAlt?: string;
}

export const AuthSplitLayout: React.FC<AuthSplitLayoutProps> = ({
  children,
  title,
  subtitle,
  heroIconSrc = ruasHeroIcon,
  heroIconAlt = "RUAS Visual Icon",
}) => {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-12 bg-surface">
      {/* Kolom Kiri: Branding & Visual Panel (Hidden on Mobile < md, Sticky Viewport Height on md+) */}
      <div className="hidden md:flex md:col-span-5 lg:col-span-5 bg-base border-r border-border/80 p-8 lg:p-12 flex-col justify-between shadow-subtle relative overflow-hidden md:sticky md:top-0 md:h-screen">
        {/* Subtle ambient light */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 rounded-full bg-primary/5 pointer-events-none blur-3xl" />

        {/* 1. Logo RUAS (Top Left) */}
        <div className="relative z-10 text-left -mt-2 lg:-mt-3">
          <Link href="/" className="inline-block transition-opacity hover:opacity-90">
            <Image
              src={ruasLogo}
              alt="RUAS — Sistem Prioritas Jalan"
              priority
              className="h-7.5 md:h-8 lg:h-8.5 w-auto object-contain"
            />
          </Link>
        </div>

        {/* 2. Hero Illustration & Text (Center area) */}
        <div className="relative z-10 my-auto py-6 flex flex-col items-start text-left w-full">
          {/* Centered Hero Icon (Centered horizontally within left panel) */}
          <div className="w-full flex justify-center items-center mb-6 md:mb-8">
            <div className="relative w-52 h-52 md:w-56 md:h-56 lg:w-72 lg:h-72 xl:w-80 xl:h-80 flex items-center justify-center">
              <Image
                src={heroIconSrc}
                alt={heroIconAlt}
                fill
                sizes="(max-width: 768px) 208px, (max-width: 1024px) 224px, 320px"
                className="object-contain drop-shadow-sm"
                priority
              />
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-xl md:text-2xl lg:text-[1.75rem] font-black text-text-primary tracking-tight leading-tight mb-3 text-left">
            Sistem Pelaporan & Prioritas Jalan Berbasis AI
          </h2>

          {/* Description */}
          <p className="text-xs md:text-sm text-text-secondary leading-relaxed max-w-sm font-normal text-left">
            Membantu warga dan dinas terkait mempercepat verifikasi serta alokasi perbaikan jalan secara objektif, transparan, dan akuntabel.
          </p>
        </div>

        {/* 3. Footer / Copyright */}
        <div className="relative z-10 text-[11px] font-medium text-text-muted pt-4 border-t border-border/70 text-left">
          &copy; {new Date().getFullYear()} RUAS. Platform Pelayanan Publik.
        </div>
      </div>

      {/* Kolom Kanan: Form Container (Full Width di Mobile, Natural Scroll independently) */}
      <div className="md:col-span-7 lg:col-span-7 flex flex-col justify-start md:justify-center items-center p-4 sm:p-6 md:p-10 lg:p-16 min-h-[100dvh] pt-10 pb-8 sm:py-12 md:py-16">
        <div className="w-full max-w-md my-0 md:my-auto">
          <div className="mb-7 text-center">
            <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight mb-2.5">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-xs sm:max-w-sm mx-auto">
              {subtitle}
            </p>
          </div>
          <Card className="p-6 sm:p-7 md:p-8 bg-base border-border/80 shadow-float rounded-2xl sm:rounded-3xl">
            {children}
          </Card>
        </div>
      </div>
    </div>
  );
};
