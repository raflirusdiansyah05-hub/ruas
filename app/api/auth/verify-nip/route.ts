import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyNipSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  try {
    const isDevAdminSignup = process.env.ENABLE_DEV_ADMIN_SIGNUP === "true";

    const body = await request.json();
    const parseResult = verifyNipSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: {
            message: "Format NIP atau instansi tidak valid",
            code: "VALIDATION_ERROR",
            details: parseResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { nip, instansi } = parseResult.data;

    // Pastikan NIP hanya terdiri dari 18 digit angka
    if (!/^\d{18}$/.test(nip)) {
      return NextResponse.json(
        {
          error: {
            message: "Format NIP harus 18 digit angka",
            code: "INVALID_NIP_FORMAT",
          },
        },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Query ke tabel instansi_referensi
    const { data: record, error } = await supabase
      .from("instansi_referensi")
      .select("id, nip, nama_pegawai, instansi, is_active")
      .eq("nip", nip)
      .single();

    if (error || !record) {
      // Jika mode dev/lomba aktif, izinkan tanpa harus ada di database instansi_referensi
      if (isDevAdminSignup) {
        return NextResponse.json({
          data: {
            verified: true,
            nama_pegawai: "Pegawai Demo (Dev Mode)",
            instansi,
            is_dev_mode: true,
          },
        });
      }

      return NextResponse.json(
        {
          error: {
            message: "NIP tidak ditemukan dalam pangkalan data instansi resmi",
            code: "NIP_NOT_FOUND",
          },
        },
        { status: 404 }
      );
    }

    if (!record.is_active) {
      return NextResponse.json(
        {
          error: {
            message: "Status pegawai dengan NIP ini tidak aktif",
            code: "NIP_INACTIVE",
          },
        },
        { status: 403 }
      );
    }

    // Cek kecocokan instansi (case-insensitive substring)
    const normalizedInputInstansi = instansi.toLowerCase().trim();
    const normalizedDbInstansi = record.instansi.toLowerCase().trim();

    if (
      !normalizedDbInstansi.includes(normalizedInputInstansi) &&
      !normalizedInputInstansi.includes(normalizedDbInstansi)
    ) {
      return NextResponse.json(
        {
          error: {
            message: "Instansi tidak sesuai dengan data terdaftar untuk NIP tersebut",
            code: "INSTANSI_MISMATCH",
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      data: {
        verified: true,
        nama_pegawai: record.nama_pegawai,
        instansi: record.instansi,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: {
          message: err.message || "Terjadi kesalahan pada server saat verifikasi NIP",
          code: "SERVER_ERROR",
        },
      },
      { status: 500 }
    );
  }
}
