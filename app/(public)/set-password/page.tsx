"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthSplitLayout } from "@/components/shared/AuthSplitLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, CheckCircle2, UserCheck, AlertCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SetPasswordPage() {
  const router = useRouter();
  const [petugasInfo, setPetugasInfo] = useState<{
    fullName: string;
    email: string;
    wilayah: string;
  } | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifyingSession, setVerifyingSession] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);
  const [activated, setActivated] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    const populateInfo = (user: any) => {
      if (!user) return;
      setPetugasInfo({
        fullName: (user.user_metadata?.full_name as string) || "Petugas Lapangan",
        email: user.email || "",
        wilayah: (user.user_metadata?.wilayah as string) || "Seluruh Wilayah",
      });
    };

    const processInvitationSession = async () => {
      try {
        setVerifyingSession(true);
        setErrorMessage(null);

        // 1. Periksa parameter autentikasi dari URL hash (Implicit Grant Flow pada undangan Supabase)
        const hash = window.location.hash.startsWith("#")
          ? window.location.hash.substring(1)
          : window.location.hash;
        const hashParams = new URLSearchParams(hash);
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const errorDesc = hashParams.get("error_description");

        // 2. Periksa parameter dari URL query (PKCE flow / token_hash OTP)
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get("code");
        const tokenHash = searchParams.get("token_hash");
        const authType = searchParams.get("type");

        if (errorDesc) {
          throw new Error(
            "Undangan tidak valid atau sudah kedaluwarsa. Silakan minta Admin mengirimkan undangan baru."
          );
        }

        let activeUser = null;

        // Skenario A: URL membawa access_token & refresh_token di hash (format standar Supabase Invite)
        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.warn("[set-password] setSession error:", error.message);
            throw new Error(
              "Undangan tidak valid atau sudah kedaluwarsa. Silakan minta Admin mengirimkan undangan baru."
            );
          }

          activeUser = data.user;

          // Bersihkan hash dari URL agar token sensitif tidak tersimpan di browser history
          if (typeof window !== "undefined") {
            window.history.replaceState(
              null,
              "",
              window.location.pathname + window.location.search
            );
          }
        }
        // Skenario B: URL membawa PKCE code
        else if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.warn("[set-password] exchangeCode error:", error.message);
            throw new Error(
              "Undangan tidak valid atau sudah kedaluwarsa. Silakan minta Admin mengirimkan undangan baru."
            );
          }
          activeUser = data.user;
          const cleanUrl = new URL(window.location.href);
          cleanUrl.searchParams.delete("code");
          window.history.replaceState(null, "", cleanUrl.pathname);
        }
        // Skenario C: URL membawa token_hash OTP
        else if (tokenHash && authType) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: authType as any,
          });
          if (error) {
            console.warn("[set-password] verifyOtp error:", error.message);
            throw new Error(
              "Undangan tidak valid atau sudah kedaluwarsa. Silakan minta Admin mengirimkan undangan baru."
            );
          }
          activeUser = data.user;
        }
        // Skenario D: Sesi sudah tersimpan sebelumnya di storage/cookies
        else {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.user) {
            activeUser = session.user;
          } else {
            const {
              data: { user },
            } = await supabase.auth.getUser();
            activeUser = user;
          }
        }

        if (!activeUser) {
          throw new Error(
            "Tautan undangan tidak ditemukan atau sesi telah berakhir. Silakan gunakan tautan aktivasi resmi dari email Anda."
          );
        }

        if (isMounted) {
          populateInfo(activeUser);
          setSessionValid(true);
        }
      } catch (err: any) {
        if (isMounted) {
          setSessionValid(false);
          setErrorMessage(
            err.message ||
              "Undangan tidak valid atau sudah kedaluwarsa. Silakan minta Admin mengirimkan undangan baru."
          );
        }
      } finally {
        if (isMounted) {
          setVerifyingSession(false);
        }
      }
    };

    processInvitationSession();

    // Auth state listener untuk reaktivitas sesi
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && isMounted) {
        populateInfo(session.user);
        setSessionValid(true);
        setVerifyingSession(false);
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 8) {
      setErrorMessage("Kata sandi minimal harus terdiri dari 8 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Kata sandi dan konfirmasi kata sandi tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();

      // 1. Simpan password baru pengguna terautentikasi
      const { data: updateData, error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        if (
          updateError.message.includes("Auth session missing") ||
          updateError.name === "AuthSessionMissingError"
        ) {
          setErrorMessage(
            "Sesi aktivasi telah berakhir atau tidak ditemukan. Silakan klik kembali tautan undangan dari email Anda."
          );
        } else {
          setErrorMessage(updateError.message || "Gagal menetapkan kata sandi baru.");
        }
        setLoading(false);
        return;
      }

      // 2. Aktifkan status profil petugas via server-side service role (PATCH /api/petugas/invite)
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const activateRes = await fetch("/api/petugas/invite", {
        method: "PATCH",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!activateRes.ok) {
        const actJson = await activateRes.json().catch(() => ({}));
        console.warn("[set-password] Aktivasi profile server warning:", actJson);
      }

      setActivated(true);
      setLoading(false);
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal mengaktifkan akun. Silakan coba kembali.");
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      title="Aktivasi Akun Petugas"
      subtitle="Silakan buat kata sandi untuk mengaktifkan akun penugasan lapangan Anda."
    >
      {verifyingSession ? (
        <div className="text-center py-10 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <h3 className="text-sm font-semibold text-text-primary">
            Memverifikasi Undangan Petugas...
          </h3>
          <p className="text-xs text-text-secondary max-w-xs mx-auto">
            Mohon tunggu sebentar, sistem sedang memverifikasi tautan aktivasi akun penugasan Anda.
          </p>
        </div>
      ) : activated ? (
        <div className="text-center py-4 space-y-4">
          <div className="h-12 w-12 rounded-full bg-primary-soft text-primary flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-text-primary">
            Akun Berhasil Diaktifkan!
          </h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            Selamat datang di RUAS. Akun Anda telah aktif dan siap menerima penugasan perbaikan jalan.
          </p>
          <div className="pt-2 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button
              size="sm"
              onClick={() => router.push("/petugas")}
              className="w-full sm:w-auto"
            >
              Masuk ke Portal Petugas
            </Button>
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="sm" className="w-full">
                Halaman Masuk
              </Button>
            </Link>
          </div>
        </div>
      ) : !sessionValid ? (
        <div className="space-y-4 py-2">
          <div className="p-4 rounded-xl bg-feedback-error/10 border border-feedback-error/30 text-feedback-error text-xs flex items-start gap-2.5">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-sm">Aktivasi Tidak Dapat Dilanjutkan</div>
              <div className="leading-relaxed">
                {errorMessage ||
                  "Undangan tidak valid atau sudah kedaluwarsa. Silakan minta Admin mengirimkan undangan baru."}
              </div>
            </div>
          </div>
          <Link href="/login" className="inline-block w-full">
            <Button variant="outline" className="w-full text-xs">
              Kembali ke Halaman Masuk
            </Button>
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

          {/* Read-Only Petugas Info (design.md Bagian 8.3) */}
          <div className="p-4 rounded-xl bg-surface border border-border space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <UserCheck className="h-4 w-4" />
              Undangan Resmi Petugas Lapangan
            </div>
            <div>
              <div className="text-xs text-text-secondary">Nama Petugas</div>
              <div className="text-sm font-medium text-text-primary">
                {petugasInfo?.fullName || "Memuat data petugas..."}
              </div>
            </div>
            <div>
              <div className="text-xs text-text-secondary">Email Terdaftar</div>
              <div className="text-sm font-medium text-text-primary">
                {petugasInfo?.email || "Memuat email..."}
              </div>
            </div>
            <div>
              <div className="text-xs text-text-secondary">Penetapan Wilayah Kerja</div>
              <div className="text-sm font-medium text-text-primary">
                {petugasInfo?.wilayah || "Seluruh Wilayah"}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Buat Kata Sandi Baru <span className="text-feedback-error">*</span>
            </label>
            <div className="relative">
              <Input
                type="password"
                required
                placeholder="Minimal 8 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
              <Lock className="absolute left-3.5 top-3 h-5 w-5 text-text-secondary/70 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Ulangi Kata Sandi Baru <span className="text-feedback-error">*</span>
            </label>
            <div className="relative">
              <Input
                type="password"
                required
                placeholder="Ulangi kata sandi"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
              <Lock className="absolute left-3.5 top-3 h-5 w-5 text-text-secondary/70 pointer-events-none" />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Mengaktifkan Akun...
              </>
            ) : (
              "Aktifkan Akun & Masuk"
            )}
          </Button>
        </form>
      )}
    </AuthSplitLayout>
  );
}

