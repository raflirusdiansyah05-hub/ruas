"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-base border border-border rounded-2xl p-6 text-center space-y-4 shadow-card">
        <div className="h-12 w-12 rounded-full bg-feedback-error/10 text-feedback-error flex items-center justify-center mx-auto">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-text-primary">Terjadi Kendala Sistem</h1>
          <p className="text-xs text-text-secondary mt-1">
            {error.message || "Aplikasi mengalami kendala sementara saat memproses halaman ini."}
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="outline" size="sm" onClick={() => reset()} className="text-xs gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Coba Lagi
          </Button>
          <Link href="/">
            <Button size="sm" className="text-xs gap-1.5">
              <Home className="h-3.5 w-3.5" />
              Ke Beranda
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
