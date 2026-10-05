import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto py-4">
      {/* Header & Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>

      {/* Info Card */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-5">
              <Skeleton className="w-full aspect-[4/3] rounded-xl" />
            </div>
            <div className="md:col-span-7 space-y-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <div className="pt-3 border-t border-border space-y-2">
                <Skeleton className="h-3 w-36" />
                <Skeleton className="h-3 w-44" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Card */}
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-36" />
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
          <Skeleton className="h-11 w-full rounded-xl" />
        </CardContent>
      </Card>
    </div>
  );
}
