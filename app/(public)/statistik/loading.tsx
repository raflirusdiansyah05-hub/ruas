import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="min-h-screen bg-base flex flex-col">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-base/95 backdrop-blur-md shadow-subtle">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-12 h-14 flex items-center justify-between">
          <Skeleton className="h-6 sm:h-7 md:h-8 lg:h-9 w-24 sm:w-36 rounded-md" />
          <div className="flex items-center gap-2 sm:gap-3">
            <Skeleton className="h-8 sm:h-9 w-24 sm:w-28 rounded-lg" />
            <Skeleton className="h-8 sm:h-9 w-16 sm:w-20 rounded-lg" />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-6 md:px-12 py-8 space-y-8">
        {/* Title Skeleton */}
        <div className="space-y-2 border-b border-border pb-6">
          <Skeleton className="h-8 w-80 rounded-md" />
          <Skeleton className="h-4 w-96 rounded-md" />
        </div>

        {/* 4 KPI Cards Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-border shadow-card bg-base">
              <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-7 w-16" />
                </div>
                <Skeleton className="h-10 w-10 rounded-xl" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-7 border-border shadow-card bg-base">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-48" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <Skeleton className="h-64 w-full rounded-lg" />
            </CardContent>
          </Card>
          <Card className="lg:col-span-5 border-border shadow-card bg-base">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <Skeleton className="h-64 w-full rounded-lg" />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
