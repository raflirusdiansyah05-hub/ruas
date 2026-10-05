"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AuthSplitLayout } from "@/components/shared/AuthSplitLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/reset-password`,
      });

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      setSubmitted(true);
      setLoading(false);
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal mengirim tautan reset kata sandi");
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      title="Lupa Kata Sandi"
      subtitle="Masukkan email terdaftar untuk menerima petunjuk pemulihan kata sandi."
    >
      {submitted ? (
        <div className="text-center py-4 space-y-4">
          <div className="h-12 w-12 rounded-full bg-primary-soft text-primary flex items-center justify-center mx-auto">
            <Mail className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-text-primary">
            Tautan Pemulihan Terkirim
          </h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            Jika email <span className="font-semibold text-text-primary">{email}</span> terdaftar di RUAS, kami telah mengirimkan instruksi untuk mengatur ulang kata sandi Anda.
          </p>
          <Link href="/login" className="inline-block pt-2">
            <Button variant="outline" size="sm" className="rounded-xl">
              Kembali ke Halaman Masuk
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-feedback-error/10 border border-feedback-error/25 text-feedback-error text-xs flex items-center gap-2.5 shadow-subtle">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1.5 uppercase tracking-wider">
              Email Terdaftar
            </label>
            <div className="relative">
              <Input
                type="email"
                required
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 text-sm h-11 sm:h-12 rounded-xl"
              />
              <Mail className="absolute left-3.5 top-3 sm:top-3.5 h-4 w-4 sm:h-5 sm:w-5 text-text-muted pointer-events-none" />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full shadow-card font-bold h-12 text-sm rounded-xl mt-1 sm:mt-2"
            disabled={loading}
          >
            {loading ? "Mengirim Tautan..." : "Kirim Tautan Reset"}
          </Button>
        </form>
      )}
    </AuthSplitLayout>
  );
}
