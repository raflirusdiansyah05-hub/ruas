import React from "react";
import { PetugasLayoutWrapper } from "@/components/shared/PetugasLayoutWrapper";

export default function PetugasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PetugasLayoutWrapper>{children}</PetugasLayoutWrapper>;
}
