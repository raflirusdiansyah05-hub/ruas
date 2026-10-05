import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { assignReportSchema } from "@/lib/validations/admin";

async function handleAssign(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = params.id;
    const supabase = createClient();

    // 1. Cek sesi dan otorisasi admin
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
        { error: { message: "Hanya Admin Dinas yang dapat menugaskan petugas", code: "FORBIDDEN" } },
        { status: 403 }
      );
    }

    // 2. Validasi input
    const body = await request.json();
    const parseResult = assignReportSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: {
            message: "ID Petugas tidak valid",
            code: "VALIDATION_ERROR",
            details: parseResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { petugas_id } = parseResult.data;

    // 3. Pastikan petugas terdaftar dengan role petugas dan berstatus aktif
    const { data: targetPetugas } = await adminClient
      .from("profiles")
      .select("id, full_name, role, status")
      .eq("id", petugas_id)
      .single();

    if (!targetPetugas || targetPetugas.role !== "petugas") {
      return NextResponse.json(
        { error: { message: "Petugas yang dipilih tidak valid", code: "INVALID_PETUGAS" } },
        { status: 400 }
      );
    }

    if (targetPetugas.status !== "active") {
      return NextResponse.json(
        {
          error: {
            message: "Petugas yang dipilih belum aktif atau belum menyelesaikan aktivasi akun",
            code: "PETUGAS_NOT_ACTIVE",
          },
        },
        { status: 400 }
      );
    }

    // 4. Ambil data laporan
    const { data: currentReport, error: fetchError } = await adminClient
      .from("reports")
      .select("status, reporter_id, address_text")
      .eq("id", reportId)
      .single();

    if (fetchError || !currentReport) {
      return NextResponse.json(
        { error: { message: "Laporan tidak ditemukan", code: "NOT_FOUND" } },
        { status: 404 }
      );
    }

    // 5. Insert baris baru di tabel `assignments`
    const { data: newAssignment, error: assignError } = await adminClient
      .from("assignments")
      .insert({
        report_id: reportId,
        petugas_id,
        assigned_by: user.id,
        status: "ditugaskan",
      })
      .select()
      .single();

    if (assignError || !newAssignment) {
      return NextResponse.json(
        { error: { message: assignError?.message || "Gagal membuat assignment", code: "DATABASE_ERROR" } },
        { status: 500 }
      );
    }

    // 6. Update status laporan menjadi 'dijadwalkan'
    await adminClient
      .from("reports")
      .update({ status: "dijadwalkan" })
      .eq("id", reportId);

    // 7. WAJIB catat perubahan ke status_history
    await adminClient.from("status_history").insert({
      report_id: reportId,
      status_from: currentReport.status,
      status_to: "dijadwalkan",
      changed_by: user.id,
      note: `Laporan ditugaskan ke petugas: ${targetPetugas.full_name}`,
    });

    // 8. Buat notifikasi ke Petugas Lapangan
    await adminClient.from("notifications").insert({
      user_id: petugas_id,
      title: "Penugasan Perbaikan Baru",
      message: `Anda mendapat tugas baru di lokasi: ${currentReport.address_text || "titik penugasan"}.`,
      related_report_id: reportId,
    });

    // 9. Buat notifikasi ke Pelapor
    await adminClient.from("notifications").insert({
      user_id: currentReport.reporter_id,
      title: "Laporan Dijadwalkan",
      message: `Laporan Anda telah dijadwalkan dan ditugaskan kepada tim teknis lapangan (${targetPetugas.full_name}).`,
      related_report_id: reportId,
    });

    return NextResponse.json({
      data: {
        success: true,
        assignment: newAssignment,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err.message || "Terjadi kesalahan server", code: "SERVER_ERROR" } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  return handleAssign(request, context);
}

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  return handleAssign(request, context);
}
