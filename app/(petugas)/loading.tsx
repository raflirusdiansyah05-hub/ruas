import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Title & Badge */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-3.5 w-64" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>

      {/* Task Cards Skeleton */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-16 w-16 rounded-xl shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-9 w-28 rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
