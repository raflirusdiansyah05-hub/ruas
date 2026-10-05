"use client";

import React, { useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthSplitLayout } from "@/components/shared/AuthSplitLayout";
import { Button } from "@/components/ui/button";
import { MailCheck, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (val: string, index: number) => {
    if (val.length > 1) {
      const pasted = val.slice(0, 6).split("");
      const newOtp = [...otp];
      pasted.forEach((char, i) => {
        newOtp[i] = char;
      });
      setOtp(newOtp);
      const nextIdx = Math.min(pasted.length, 5);
      inputRefs.current[nextIdx]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const token = otp.join("");
      const supabase = createClient();
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "signup",
      });

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      // Berhasil verifikasi email, redirect ke dashboard sesuai role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user?.id || "")
        .single();

      if (profile?.role === "admin") {
        router.push("/admin");
      } else if (profile?.role === "petugas") {
        router.push("/petugas");
      } else {
        router.push("/pelapor");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal memverifikasi kode OTP");
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      title="Verifikasi Kode OTP"
      subtitle="Masukkan 6 digit kode verifikasi yang telah dikirim ke email Anda."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {errorMessage && (
          <div className="p-3 rounded-lg bg-feedback-error/10 border border-feedback-error/30 text-feedback-error text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="flex justify-center my-2">
          <div className="h-12 w-12 rounded-full bg-primary-soft text-primary flex items-center justify-center">
            <MailCheck className="h-6 w-6" />
          </div>
        </div>

        {/* 6 Digit Input Boxes */}
        <div className="flex justify-center gap-2 sm:gap-3">
          {otp.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => {
                inputRefs.current[idx] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e.target.value, idx)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className="h-12 w-11 sm:h-14 sm:w-12 text-center text-xl font-bold rounded-lg border border-border bg-base text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          ))}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={loading || otp.join("").length < 6}
        >
          {loading ? "Memverifikasi..." : "Verifikasi Email"}
        </Button>

        <div className="text-center text-xs text-text-secondary">
          Tidak menerima kode?{" "}
          <button
            type="button"
            className="text-primary font-medium hover:underline focus:outline-none"
            onClick={() => alert("Kode verifikasi baru telah dikirim (simulasi).")}
          >
            Kirim Ulang
          </button>
        </div>
      </form>
    </AuthSplitLayout>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Memuat...</div>}>
      <VerifyOtpForm />
    </Suspense>
  );
}

