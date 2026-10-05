import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assignmentId = params.id;
    if (!assignmentId) {
      return NextResponse.json(
        {
          error: {
            message: "ID penugasan tidak valid",
            code: "BAD_REQUEST",
          },
        },
        { status: 400 }
      );
    }

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
            message: "Hanya petugas lapangan atau admin yang berhak mengakses penugasan ini",
            code: "FORBIDDEN",
          },
        },
        { status: 403 }
      );
    }

    // 3. Ambil data penugasan lengkap
    const { data: assignment, error: queryError } = await adminClient
      .from("assignments")
      .select(`
        id,
        status,
        assigned_at,
        proof_photo_url,
        completed_at,
        report_id,
        petugas_id,
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
      `)
      .eq("id", assignmentId)
      .single();

    if (queryError || !assignment) {
      return NextResponse.json(
        {
          error: {
            message: "Data penugasan tidak ditemukan",
            code: "NOT_FOUND",
          },
        },
        { status: 404 }
      );
    }

    // Otorisasi ketat: Petugas hanya boleh mengakses detail tugas miliknya
    if (role === "petugas" && assignment.petugas_id !== user.id) {
      return NextResponse.json(
        {
          error: {
            message: "Anda tidak berhak melihat penugasan milik petugas lain",
            code: "FORBIDDEN",
          },
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      data: {
        assignment,
      },
    });
  } catch (err: any) {
    console.error("[GET /api/assignments/[id]] Error:", err?.message || err);
    return NextResponse.json(
      {
        error: {
          message: "Terjadi kesalahan saat memuat detail penugasan",
          code: "INTERNAL_SERVER_ERROR",
        },
      },
      { status: 500 }
    );
  }
}
