import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { verifyReportSchema } from "@/lib/validations/admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = params.id;
    const supabase = createClient();

    // 1. Cek sesi dan otorisasi role admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { message: "Sesi tidak valid", code: "UNAUTHORIZED" } },
        { status: 401 }
      );
    }

    const adminClient = createAdminClient();

    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: { message: "Hanya Admin Dinas yang dapat memverifikasi laporan", code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    // 2. Validasi input
    const body = await request.json();
    const parseResult = verifyReportSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: {
            message: "Aksi verifikasi tidak valid",
            code: "VALIDATION_ERROR",
            details: parseResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { action, reason } = parseResult.data;
    const newStatus = action === "verify" ? "diverifikasi" : "ditolak";

    // 3. Ambil data laporan lama
    const { data: currentReport, error: fetchError } = await adminClient
      .from("reports")
      .select("status, reporter_id")
      .eq("id", reportId)
      .single();

    if (fetchError || !currentReport) {
      return NextResponse.json(
        { error: { message: "Laporan tidak ditemukan", code: "NOT_FOUND" } },
        { status: 404 }
      );
    }

    // 4. Update status laporan (dan rejection_reason bila ditolak)
    const { data: updatedReport, error: updateError } = await adminClient
      .from("reports")
      .update({
        status: newStatus,
        rejection_reason: action === "reject" ? reason || "Tidak memenuhi kriteria perbaikan dinas" : null,
      })
      .eq("id", reportId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: { message: updateError.message, code: "DATABASE_ERROR" } },
        { status: 500 }
      );
    }

    // 5. WAJIB catat perubahan ke status_history
    await adminClient.from("status_history").insert({
      report_id: reportId,
      status_from: currentReport.status,
      status_to: newStatus,
      changed_by: user.id,
      note: action === "verify" ? "Laporan diverifikasi oleh Admin Dinas" : `Laporan ditolak: ${reason || "-"}`,
    });

    // 6. Buat notifikasi ke pelapor
    await adminClient.from("notifications").insert({
      user_id: currentReport.reporter_id,
      title: action === "verify" ? "Laporan Diverifikasi" : "Laporan Ditolak",
      message:
        action === "verify"
          ? "Laporan kerusakan jalan Anda telah diverifikasi valid oleh Admin Dinas dan masuk ke tahap penjadwalan."
          : `Laporan Anda ditolak dengan alasan: ${reason || "Tidak memenuhi ketentuan dinas"}.`,
      related_report_id: reportId,
    });

    return NextResponse.json({
      data: {
        success: true,
        report: updatedReport,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err.message || "Terjadi kesalahan server", code: "SERVER_ERROR" } },
      { status: 500 }
    );
  }
}
