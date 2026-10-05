import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // 1. Verifikasi sesi pengguna
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: {
            message: "Sesi tidak valid atau telah berakhir",
            code: "UNAUTHORIZED",
          },
        },
        { status: 401 }
      );
    }

    const adminClient = createAdminClient();

    // 2. Ambil profil user untuk otorisasi role
    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;
    if (role !== "petugas" && role !== "admin") {
      return NextResponse.json(
        {
          error: {
            message: "Hanya petugas lapangan atau admin yang dapat mengakses penugasan",
            code: "FORBIDDEN",
          },
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");

    // 3. Query penugasan beserta relasi laporan, priority score, dan deteksi
    let query = adminClient
      .from("assignments")
      .select(`
        id,
        status,
        assigned_at,
        proof_photo_url,
        completed_at,
        report_id,
        reports (
          id,
          photo_url,
          latitude,
          longitude,
          address_text,
          description,
          fungsi_jalan,
          status,
          priority_scores (severity_level, priority_value),
          detections (damage_type, confidence)
        )
      `);

    // Isolasi keamanan: Petugas HANYA boleh melihat tugas miliknya sendiri
    if (role === "petugas") {
      query = query.eq("petugas_id", user.id);
    }

    // Filter status & sorting
    if (statusParam === "semua") {
      // Tampilkan seluruh riwayat
      query = query.order("assigned_at", { ascending: false });
    } else if (statusParam === "selesai") {
      query = query.eq("status", "selesai").order("completed_at", { ascending: false });
    } else if (statusParam === "ditugaskan" || statusParam === "dikerjakan") {
      query = query.eq("status", statusParam).order("assigned_at", { ascending: false });
    } else {
      // Default: tugas aktif (ditugaskan atau dikerjakan)
      query = query.in("status", ["ditugaskan", "dikerjakan"]).order("assigned_at", { ascending: false });
    }

    const { data: assignments, error: queryError } = await query;

    if (queryError) {
      console.error("[GET /api/assignments] Query error:", queryError);
      return NextResponse.json(
        {
          error: {
            message: "Gagal memuat daftar penugasan",
            code: "DATABASE_ERROR",
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        assignments: assignments || [],
      },
    });
  } catch (err: any) {
    console.error("[GET /api/assignments] Internal error:", err?.message || err);
    return NextResponse.json(
      {
        error: {
          message: "Terjadi kesalahan internal pada server",
          code: "INTERNAL_SERVER_ERROR",
        },
      },
      { status: 500 }
    );
  }
}
