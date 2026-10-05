import React from "react";
import { PelaporLayoutWrapper } from "@/components/shared/PelaporLayoutWrapper";

export default function PelaporLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PelaporLayoutWrapper>{children}</PelaporLayoutWrapper>;
}
