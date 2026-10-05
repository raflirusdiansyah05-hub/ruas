"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthSplitLayout } from "@/components/shared/AuthSplitLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ruasLoginIcon from "@/ruas-login-icon.png";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage("Silakan masukkan email dan kata sandi Anda.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();

      // Bersihkan sesi lama secara mutlak sebelum memulai autentikasi kredensial baru
      await supabase.auth.signOut();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        // Tampilkan pesan error bahasa Indonesia yang ramah
        if (error.message.includes("Invalid login credentials")) {
          setErrorMessage("Email atau kata sandi yang Anda masukkan salah.");
        } else if (error.message.includes("Email not confirmed")) {
          setErrorMessage("Alamat email belum dikonfirmasi. Silakan periksa inbox/spam email Anda.");
        } else {
          setErrorMessage(error.message || "Gagal masuk. Silakan coba beberapa saat lagi.");
        }
        setLoading(false);
        return;
      }

      if (data?.user) {
        // Verifikasi ketat: pastikan user yang diautentikasi sesuai dengan email input
        if (data.user.email?.toLowerCase() !== cleanEmail.toLowerCase()) {
          await supabase.auth.signOut();
          setErrorMessage("Terjadi ketidaksesuaian autentikasi. Silakan coba lagi.");
          setLoading(false);
          return;
        }

        // Pastikan cookie auth tersinkron sebelum redirect
        await supabase.auth.getSession();

        // Ambil data profile resmi dari database
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        // Prioritas role: profiles.role -> user_metadata.role -> default pelapor
        const userRole = profile?.role || (data.user.user_metadata?.role as string) || "pelapor";

        if (userRole === "admin") {
          window.location.href = "/admin";
        } else if (userRole === "petugas") {
          window.location.href = "/petugas";
        } else {
          window.location.href = "/pelapor";
        }
      } else {
        setErrorMessage("Gagal mendapatkan data sesi pengguna.");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Login exception:", err);
      setErrorMessage(err.message || "Terjadi kendala saat menghubungi server.");
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      title="Masuk ke Akun Anda"
      subtitle="Masukkan kredensial akun RUAS Anda untuk melanjutkan."
      heroIconSrc={ruasLoginIcon}
      heroIconAlt="RUAS Login Icon"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-feedback-error/10 border border-feedback-error/25 text-feedback-error text-xs flex items-center gap-2.5 shadow-subtle">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-text-primary mb-2 uppercase tracking-wider">
            Alamat Email
          </label>
          <div className="relative">
            <Input
              type="email"
              required
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-11 pr-4 text-sm h-12 rounded-xl"
            />
            <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-text-muted pointer-events-none" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider">
              Kata Sandi
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              Lupa sandi?
            </Link>
          </div>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-11 pr-11 text-sm h-12 rounded-xl"
            />
            <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-text-muted pointer-events-none" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-3.5 text-text-muted hover:text-text-primary transition-colors focus:outline-hidden p-0.5"
              aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div>
          <Button
            type="submit"
            className="w-full shadow-card font-bold h-12 text-sm rounded-xl transition-all"
            disabled={loading}
          >
            {loading ? "Memproses Verifikasi..." : "Masuk ke Akun"}
          </Button>

          {/* Link Daftar */}
          <div className="text-center text-xs pt-4">
            <Link
              href="/sign-up"
              className="text-primary hover:underline font-bold transition-colors"
            >
              Daftar Akun Baru
            </Link>
          </div>
        </div>
      </form>
    </AuthSplitLayout>
  );
}
