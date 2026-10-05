import React from "react";
import { AdminSidebar } from "@/components/shared/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminSidebar>{children}</AdminSidebar>;
}
