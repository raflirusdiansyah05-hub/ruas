import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { createReportSchema } from "@/lib/validations/report";
import { getDetectionProvider } from "@/lib/ai";
import { calculatePriorityScore, calculateStaleness } from "@/lib/scoring/priority";
import { FungsiJalan, ReportStatus } from "@/types/database";

export async function POST(request: NextRequest) {
  try {
    // 1. Validasi Autentikasi User via Supabase Server Client
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: {
            message: "Anda harus masuk untuk membuat laporan",
            code: "UNAUTHORIZED",
          },
        },
        { status: 401 }
      );
    }

    // 2. Validasi Input Request via Zod Schema
    const body = await request.json();
    const parseResult = createReportSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: {
            message: "Data laporan tidak valid atau fungsi jalan belum dipilih",
            code: "VALIDATION_ERROR",
            details: parseResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const {
      photo_url,
      latitude,
      longitude,
      address_text,
      description,
      fungsi_jalan,
    } = parseResult.data;

    // Service-role client untuk operasi pipeline backend server-side
    const adminClient = createAdminClient();

    // 3. Simpan baris baru ke tabel `reports` (status: 'baru')
    const { data: newReport, error: reportError } = await adminClient
      .from("reports")
      .insert({
        reporter_id: user.id,
        photo_url,
        latitude,
        longitude,
        address_text: address_text || null,
        description: description || null,
        fungsi_jalan: fungsi_jalan as FungsiJalan,
        status: "baru",
      })
      .select()
      .single();

    if (reportError || !newReport) {
      console.error("[POST /api/reports] Error inserting into reports:", {
        code: reportError?.code,
        message: reportError?.message,
      });
      return NextResponse.json(
        {
          error: {
            message: "Gagal menyimpan data laporan ke database",
            code: "DATABASE_ERROR",
            details: reportError?.message,
          },
        },
        { status: 500 }
      );
    }

    // 4. Panggil AI Detection Provider (abstraksi Mock ⇄ Remote)
    const aiProvider = getDetectionProvider();
    const aiResult = await aiProvider.detectDamage(photo_url);

    // 5. Simpan baris deteksi ke tabel `detections`
    if (aiResult.detections && aiResult.detections.length > 0) {
      const detectionsPayload = aiResult.detections.map((d) => ({
        report_id: newReport.id,
        damage_type: d.damage_type,
        confidence: d.confidence,
        bbox_x: d.bbox.x,
        bbox_y: d.bbox.y,
        bbox_w: d.bbox.width,
        bbox_h: d.bbox.height,
        model_version: aiResult.model_version,
      }));

      const { error: detectionsError } = await adminClient
        .from("detections")
        .insert(detectionsPayload);

      if (detectionsError) {
        console.error("[POST /api/reports] Error inserting into detections:", {
          code: detectionsError.code,
          message: detectionsError.message,
        });
      }
    }

    // 6. Hitung Skor Severity, S_norm, Exposure, dan Priority Score final
    // Formula resmi Round 3: priority_value = 0.70 * S_norm + 0.30 * E (TIDAK ADA variabel waktu T)
    const priorityOut = calculatePriorityScore(
      aiResult.detections,
      fungsi_jalan as FungsiJalan
    );

    // 7. Simpan hasil kalkulasi ke tabel `priority_scores`
    const { error: priorityError } = await adminClient
      .from("priority_scores")
      .insert({
        report_id: newReport.id,
        severity_value: priorityOut.severityValue,
        s_norm: priorityOut.sNorm,
        exposure_value: priorityOut.exposureValue,
        priority_value: priorityOut.priorityValue,
        severity_level: priorityOut.severityLevel,
        confidence_component: 0,
        density_component: 0,
      });

    if (priorityError) {
      console.error("[POST /api/reports] Error inserting into priority_scores:", {
        code: priorityError.code,
        message: priorityError.message,
      });
    }

    // 8. Catat riwayat status pertama ke `status_history`
    const { error: historyError } = await adminClient
      .from("status_history")
      .insert({
        report_id: newReport.id,
        status_from: null,
        status_to: "baru",
        changed_by: user.id,
        note: "Laporan baru dikirim oleh warga",
      });

    if (historyError) {
      console.error("[POST /api/reports] Error inserting into status_history:", {
        code: historyError.code,
        message: historyError.message,
      });
    }

    // 9. Buat notifikasi in-app untuk Admin dinas (prd.md & techstack.md: Notifikasi laporan baru/urgent in-app)
    const isUrgent =
      priorityOut.priorityValue >= 50 ||
      priorityOut.severityLevel === "critical" ||
      priorityOut.severityLevel === "high";

    // 9a. Ambil seluruh admin dinas aktif
    const { data: adminProfiles } = await adminClient
      .from("profiles")
      .select("id")
      .eq("role", "admin");

    if (adminProfiles && adminProfiles.length > 0) {
      const adminNotifs = adminProfiles.map((adm) => ({
        user_id: adm.id,
        title: isUrgent
          ? "Laporan Baru: Prioritas Tinggi/Kritis"
          : "Laporan Kerusakan Baru Masuk",
        message: isUrgent
          ? `Laporan baru di ${address_text || "lokasi"} masuk antrean dengan prioritas ${priorityOut.severityLevel.toUpperCase()} (Skor: ${priorityOut.priorityValue}) dan membutuhkan peninjauan segera.`
          : `Laporan kerusakan baru di ${address_text || "lokasi"} telah masuk ke antrean verifikasi (Skor: ${priorityOut.priorityValue}).`,
        related_report_id: newReport.id,
      }));

      const { error: adminNotifError } = await adminClient
        .from("notifications")
        .insert(adminNotifs);

      if (adminNotifError) {
        console.error("[POST /api/reports] Error inserting admin notifications:", {
          code: adminNotifError.code,
          message: adminNotifError.message,
        });
      }
    }

    // 9b. Beri notifikasi konfirmasi ke Pelapor
    const { error: notifError } = await adminClient
      .from("notifications")
      .insert({
        user_id: user.id,
        title: isUrgent
          ? "Laporan Kerusakan Prioritas Tinggi Diterima"
          : "Laporan Kerusakan Berhasil Dikirim",
        message: `Laporan Anda di ${address_text || "lokasi"} telah diterima (Tingkat Prioritas: ${priorityOut.severityLevel.toUpperCase()}, Skor: ${priorityOut.priorityValue}) dan masuk ke antrean verifikasi dinas.`,
        related_report_id: newReport.id,
      });

    if (notifError) {
      console.error("[POST /api/reports] Error inserting pelapor notification:", {
        code: notifError.code,
        message: notifError.message,
      });
    }

    // 10. Kembalikan response terstruktur
    return NextResponse.json({
      data: {
        report: newReport,
        detections: aiResult.detections,
        priority_score: priorityOut,
        model_version: aiResult.model_version,
        processing_time_ms: aiResult.processing_time_ms,
      },
    });
  } catch (err: any) {
    console.error("[POST /api/reports] Unexpected internal error:", err?.message || err);
    return NextResponse.json(
      {
        error: {
          message: err.message || "Terjadi kesalahan internal saat memproses laporan",
          code: "INTERNAL_SERVER_ERROR",
        },
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get("public") === "true";

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && !isPublic) {
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

    // Cek profil & role jika user terautentikasi
    let role = "pelapor";
    if (user) {
      const { data: profile } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      role = profile?.role || "pelapor";
    }

    const statusParam = searchParams.get("status");
    const fungsiJalanParam = searchParams.get("fungsi_jalan");
    const sortParam = searchParams.get("sort") || "priority_value.desc";

    // Pada akses publik, jangan ekspos data pribadi warga (profiles: full_name, phone, reporter_id)
    const selectFields = isPublic
      ? "id, photo_url, latitude, longitude, address_text, description, fungsi_jalan, status, created_at, priority_scores(severity_value, s_norm, exposure_value, priority_value, severity_level), detections(damage_type)"
      : "id, reporter_id, photo_url, latitude, longitude, address_text, description, fungsi_jalan, status, created_at, profiles(full_name, phone), priority_scores(severity_value, s_norm, exposure_value, priority_value, severity_level), detections(damage_type)";

    let query = adminClient
      .from("reports")
      .select(selectFields);

    // Filter role: Pelapor hanya melihat miliknya (kecuali akses publik terbuka /statistik)
    if (!isPublic && role === "pelapor" && user) {
      query = query.eq("reporter_id", user.id);
    }

    if (statusParam && statusParam !== "semua") {
      query = query.eq("status", statusParam as ReportStatus);
    }

    if (fungsiJalanParam && fungsiJalanParam !== "semua") {
      query = query.eq("fungsi_jalan", fungsiJalanParam as FungsiJalan);
    }

    // Sorting
    if (sortParam === "created_at.asc") {
      query = query.order("created_at", { ascending: true });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data: rawReports, error: fetchError } = await query;

    if (fetchError) {
      return NextResponse.json(
        {
          error: {
            message: "Gagal mengambil daftar laporan",
            code: "DATABASE_ERROR",
          },
        },
        { status: 500 }
      );
    }

    // Hitung staleness on-the-fly di server
    const enrichedReports = (rawReports || []).map((rep: any) => {
      const { hariMenunggu, isStale } = calculateStaleness(rep.created_at, rep.status);
      return {
        ...rep,
        hari_menunggu: hariMenunggu,
        is_stale: isStale,
      };
    });

    // Jika mode sort default prioritas tertinggi, urutkan berdasarkan priority_value
    if (sortParam === "priority_value.desc") {
      const getPriorityVal = (item: any): number => {
        if (Array.isArray(item.priority_scores)) {
          return Number(item.priority_scores[0]?.priority_value) || 0;
        }
        return Number(item.priority_scores?.priority_value) || 0;
      };

      enrichedReports.sort((a: any, b: any) => {
        const pA = getPriorityVal(a);
        const pB = getPriorityVal(b);
        return pB - pA;
      });
    }

    return NextResponse.json({
      data: enrichedReports,
      reports: enrichedReports,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: {
          message: err.message || "Terjadi kesalahan internal server",
          code: "INTERNAL_SERVER_ERROR",
        },
      },
      { status: 500 }
    );
  }
}
