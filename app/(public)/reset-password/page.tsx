"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AuthSplitLayout } from "@/components/shared/AuthSplitLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage("Kata sandi dan konfirmasi kata sandi tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal memperbarui kata sandi");
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      title="Atur Ulang Kata Sandi"
      subtitle="Buat kata sandi baru untuk akun RUAS Anda."
    >
      {success ? (
        <div className="text-center py-4 space-y-4">
          <div className="h-12 w-12 rounded-full bg-primary-soft text-primary flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-text-primary">
            Kata Sandi Berhasil Diperbarui
          </h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            Anda sekarang dapat masuk ke aplikasi menggunakan kata sandi yang baru.
          </p>
          <Link href="/login" className="inline-block pt-2">
            <Button size="sm">Masuk Sekarang</Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-feedback-error/10 border border-feedback-error/30 text-feedback-error text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Kata Sandi Baru
            </label>
            <div className="relative">
              <Input
                type="password"
                required
                placeholder="Minimal 8 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
              />
              <Lock className="absolute left-3.5 top-3 h-5 w-5 text-text-secondary/70 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Konfirmasi Kata Sandi Baru
            </label>
            <div className="relative">
              <Input
                type="password"
                required
                placeholder="Ulangi kata sandi baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10"
              />
              <Lock className="absolute left-3.5 top-3 h-5 w-5 text-text-secondary/70 pointer-events-none" />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan Kata Sandi Baru"}
          </Button>
        </form>
      )}
    </AuthSplitLayout>
  );
}
