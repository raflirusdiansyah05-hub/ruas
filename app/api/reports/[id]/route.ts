import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = params.id;
    if (!reportId) {
      return NextResponse.json(
        {
          error: {
            message: "ID laporan tidak valid",
            code: "BAD_REQUEST",
          },
        },
        { status: 400 }
      );
    }

    // 1. Verifikasi sesi user
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

    const userRole = profile?.role || "pelapor";

    // 3. Ambil data laporan
    const { data: report, error: reportError } = await adminClient
      .from("reports")
      .select("id, reporter_id, photo_url, latitude, longitude, address_text, description, fungsi_jalan, status, rejection_reason, created_at")
      .eq("id", reportId)
      .single();

    if (reportError || !report) {
      return NextResponse.json(
        {
          error: {
            message: "Laporan tidak ditemukan",
            code: "NOT_FOUND",
          },
        },
        { status: 404 }
      );
    }

    // 4. Otorisasi kepemilikan data:
    // Pelapor HANYA boleh membaca laporannya sendiri
    if (userRole === "pelapor" && report.reporter_id !== user.id) {
      return NextResponse.json(
        {
          error: {
            message: "Anda tidak memiliki izin untuk melihat laporan ini",
            code: "FORBIDDEN",
          },
        },
        { status: 403 }
      );
    }

    // 4b. Ambil profil pelapor
    const { data: reporterProfile } = await adminClient
      .from("profiles")
      .select("full_name, phone")
      .eq("id", report.reporter_id)
      .single();

    // 5. Ambil data relasi detections
    const { data: detections } = await adminClient
      .from("detections")
      .select("id, damage_type, confidence, bbox_x, bbox_y, bbox_w, bbox_h, model_version, created_at")
      .eq("report_id", reportId);

    // 6. Ambil data relasi priority_scores
    const { data: priorityScore } = await adminClient
      .from("priority_scores")
      .select("id, severity_value, s_norm, exposure_value, priority_value, severity_level, computed_at")
      .eq("report_id", reportId)
      .single();

    // 7. Ambil data status_history
    const { data: statusHistory } = await adminClient
      .from("status_history")
      .select("id, status_from, status_to, changed_by, changed_at, note")
      .eq("report_id", reportId)
      .order("changed_at", { ascending: true });

    // 8. Ambil data assignments jika ada
    const { data: assignments, error: assignErr } = await adminClient
      .from("assignments")
      .select("id, petugas_id, assigned_at, status, proof_photo_url, completed_at")
      .eq("report_id", reportId);

    if (assignErr) {
      console.error("[GET /api/reports/[id]] Error loading assignments:", assignErr);
    }

    // 9. Ambil daftar petugas aktif untuk keperluan assignment oleh admin
    let activePetugas: any[] = [];
    if (userRole === "admin") {
      const { data: pet } = await adminClient
        .from("profiles")
        .select("id, full_name, wilayah")
        .eq("role", "petugas")
        .eq("status", "active")
        .order("full_name", { ascending: true });
      activePetugas = pet || [];
    }

    const fullReport = {
      ...report,
      profiles: reporterProfile || null,
      detections: detections || [],
      priority_scores: priorityScore || null,
      assignments: assignments || [],
    };

    return NextResponse.json({
      data: {
        report: fullReport,
        detections: detections || [],
        priority_score: priorityScore || null,
        status_history: statusHistory || [],
        assignments: assignments || [],
        active_petugas: activePetugas,
      },
      report: fullReport,
      active_petugas: activePetugas,
    });
  } catch (err: any) {
    console.error("[GET /api/reports/[id]] Error:", err?.message || err);
    return NextResponse.json(
      {
        error: {
          message: "Terjadi kesalahan saat memuat detail laporan",
          code: "INTERNAL_SERVER_ERROR",
        },
      },
      { status: 500 }
    );
  }
}
