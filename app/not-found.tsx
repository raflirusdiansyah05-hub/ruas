import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-base border border-border rounded-2xl p-6 text-center space-y-4 shadow-card">
        <div className="h-12 w-12 rounded-full bg-primary-soft text-primary flex items-center justify-center mx-auto">
          <FileQuestion className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">404 - Halaman Tidak Ditemukan</h1>
          <p className="text-xs text-text-secondary mt-1">
            Halaman yang Anda tuju tidak tersedia atau telah dipindahkan.
          </p>
        </div>
        <div className="pt-2">
          <Link href="/">
            <Button size="sm" className="text-xs gap-1.5">
              <Home className="h-3.5 w-3.5" />
              Kembali ke Beranda
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
