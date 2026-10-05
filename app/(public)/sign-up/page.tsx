"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthSplitLayout } from "@/components/shared/AuthSplitLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, ShieldCheck, BadgeCheck, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import ruasSignUpIcon from "@/ruas-sign-up-icon.png";

export default function SignUpPage() {
  const router = useRouter();
  const [role, setRole] = useState<"pelapor" | "admin">("pelapor");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [nip, setNip] = useState("");
  const [instansi, setInstansi] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isDevAdminSignup = process.env.NEXT_PUBLIC_ENABLE_DEV_ADMIN_SIGNUP === "true";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const cleanFullName = fullName.trim();
      const cleanEmail = email.trim().toLowerCase();
      const cleanPhone = phone.trim();
      const cleanNip = nip.trim();
      const cleanInstansi = instansi.trim();

      // 1. Validasi Input Dasar
      if (cleanFullName.length < 2) {
        setErrorMessage("Nama lengkap minimal 2 karakter.");
        setLoading(false);
        return;
      }

      if (!cleanEmail || !cleanEmail.includes("@")) {
        setErrorMessage("Format email tidak valid.");
        setLoading(false);
        return;
      }

      if (password.length < 8) {
        setErrorMessage("Kata sandi minimal 8 karakter.");
        setLoading(false);
        return;
      }

      // 2. Jika Role Admin, validasi format NIP & Instansi
      if (role === "admin") {
        if (!/^\d{18}$/.test(cleanNip)) {
          setErrorMessage("NIP harus terdiri dari 18 digit angka sesuai standar kepegawaian.");
          setLoading(false);
          return;
        }

        if (cleanInstansi.length < 3) {
          setErrorMessage("Nama instansi kedinasan minimal 3 karakter.");
          setLoading(false);
          return;
        }

        // Jika mode production (bukan dev mode), wajib verifikasi NIP ke database ASN resmi
        if (!isDevAdminSignup) {
          const verifyRes = await fetch("/api/auth/verify-nip", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nip: cleanNip, instansi: cleanInstansi }),
          });

          const verifyData = await verifyRes.json();
          if (!verifyRes.ok) {
            setErrorMessage(
              verifyData.error?.message || "Verifikasi NIP gagal. Pastikan NIP dan instansi sesuai data resmi."
            );
            setLoading(false);
            return;
          }
        }
      }

      // 3. Registrasi Akun via Supabase Auth
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanFullName,
            role,
            phone: cleanPhone || null,
            nip: role === "admin" ? cleanNip : null,
            instansi: role === "admin" ? cleanInstansi : null,
          },
        },
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          setErrorMessage("Email ini sudah terdaftar. Silakan masuk melalui halaman login.");
        } else if (error.message.includes("Password should be")) {
          setErrorMessage("Kata sandi terlalu lemah. Minimal 6-8 karakter.");
        } else {
          setErrorMessage(error.message || "Gagal melakukan pendaftaran.");
        }
        setLoading(false);
        return;
      }

      // Jika email sudah auto-confirmed atau user session langsung terbentuk
      if (data?.session) {
        if (role === "admin") {
          window.location.href = "/admin";
        } else {
          window.location.href = "/pelapor";
        }
        return;
      }

      // Jika butuh verifikasi email (OTP)
      if (data?.user?.identities?.length === 0) {
        setErrorMessage("Email ini sudah terdaftar. Silakan langsung masuk.");
        setLoading(false);
        return;
      }

      router.push(`/verify-otp?email=${encodeURIComponent(cleanEmail)}`);
    } catch (err: any) {
      console.error("SignUp exception:", err);
      setErrorMessage(err.message || "Terjadi kesalahan sistem saat mendaftar.");
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      title="Daftar Akun RUAS"
      subtitle="Pilih peran Anda dan isi formulir pendaftaran akun."
      heroIconSrc={ruasSignUpIcon}
      heroIconAlt="RUAS Sign Up Icon"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-lg bg-feedback-error/10 border border-feedback-error/30 text-feedback-error text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Role Selector Tabs */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-text-muted uppercase tracking-wider">
            Daftar Sebagai
          </label>
          <div className="grid grid-cols-2 gap-2.5 p-1 rounded-2xl bg-surface border border-border/80">
            <button
              type="button"
              onClick={() => setRole("pelapor")}
              className={cn(
                "flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-150 min-h-[44px]",
                role === "pelapor"
                  ? "bg-base text-primary shadow-subtle border border-border/80"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              <User className="h-4 w-4" />
              <span>Warga (Pelapor)</span>
            </button>
            <button
              type="button"
              onClick={() => setRole("admin")}
              className={cn(
                "flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-150 min-h-[44px]",
                role === "admin"
                  ? "bg-base text-primary shadow-subtle border border-border/80"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Admin Dinas</span>
            </button>
          </div>
        </div>

        {/* Input Fields */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Nama Lengkap
          </label>
          <Input
            required
            placeholder={role === "admin" ? "Nama Lengkap beserta Gelar" : "Nama Lengkap Anda"}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Alamat Email
          </label>
          <Input
            type="email"
            required
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Nomor Telepon / WhatsApp (Opsional)
          </label>
          <Input
            type="tel"
            placeholder="08123456789"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        {/* Conditional Fields untuk Admin Dinas */}
        {role === "admin" && (
          <div className="p-4 rounded-xl bg-surface border border-border space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <BadgeCheck className="h-4 w-4" />
              Verifikasi Kepegawaian ASN
            </div>

            {isDevAdminSignup && (
              <div className="p-2.5 rounded-lg bg-primary-soft border border-primary/20 text-primary text-[11px] flex items-center gap-1.5 leading-tight">
                <span className="font-semibold shrink-0">Mode demo:</span>
                <span>Verifikasi NIP instansi resmi dinonaktifkan.</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                NIP (18 Digit)
              </label>
              <Input
                required
                maxLength={18}
                inputMode="numeric"
                placeholder="Contoh: 198501012010011001"
                value={nip}
                onChange={(e) => setNip(e.target.value.replace(/\D/g, "").slice(0, 18))}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-primary mb-1">
                Instansi Kedinasan
              </label>
              <Input
                required
                placeholder="Contoh: Dinas Bina Marga dan Penataan Ruang"
                value={instansi}
                onChange={(e) => setInstansi(e.target.value)}
              />
            </div>

            {!isDevAdminSignup && (
              <p className="text-[11px] text-text-secondary leading-tight">
                *NIP dan Instansi akan diverifikasi otomatis terhadap data kepegawaian resmi.
              </p>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Kata Sandi
          </label>
          <Input
            type="password"
            required
            placeholder="Minimal 8 karakter"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Memproses..." : role === "admin" ? "Daftar sebagai Admin" : "Daftar sebagai Pelapor"}
        </Button>

        <p className="text-center text-xs text-text-secondary leading-relaxed">
          Dengan mendaftar, Anda menyetujui{" "}
          <Link href="/terms" className="text-primary hover:underline">
            Syarat & Ketentuan
          </Link>{" "}
          serta{" "}
          <Link href="/privacy-policy" className="text-primary hover:underline">
            Kebijakan Privasi
          </Link>{" "}
          RUAS.
        </p>

        <div className="text-center text-xs text-text-secondary pt-3 border-t border-border">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Masuk ke Akun
          </Link>
        </div>
      </form>
    </AuthSplitLayout>
  );
}
