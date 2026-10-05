import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// GET: Ambil daftar notifikasi milik user saat ini
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
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
    const { data: notifications, error } = await adminClient
      .from("notifications")
      .select("id, title, message, is_read, related_report_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) throw error;

    const unreadCount = notifications?.filter((n) => !n.is_read).length || 0;

    return NextResponse.json({
      data: {
        notifications: notifications || [],
        unread_count: unreadCount,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: {
          message: err.message || "Gagal memuat notifikasi",
          code: "INTERNAL_SERVER_ERROR",
        },
      },
      { status: 500 }
    );
  }
}

// PATCH: Tandai notifikasi sebagai sudah dibaca (bisa satuan via query param ?id=xxx atau tandai semua dibaca)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { message: "Sesi tidak valid", code: "UNAUTHORIZED" } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const notifId = searchParams.get("id");

    const adminClient = createAdminClient();
    let query = adminClient
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id);

    if (notifId) {
      query = query.eq("id", notifId);
    }

    const { error } = await query;
    if (error) throw error;

    return NextResponse.json({
      data: {
        success: true,
        message: notifId
          ? "Notifikasi telah ditandai dibaca"
          : "Semua notifikasi telah ditandai dibaca",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: {
          message: err.message || "Gagal memperbarui notifikasi",
          code: "INTERNAL_SERVER_ERROR",
        },
      },
      { status: 500 }
    );
  }
}
