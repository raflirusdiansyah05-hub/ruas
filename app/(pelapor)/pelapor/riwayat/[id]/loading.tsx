import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="min-h-screen bg-surface py-6 px-4 sm:px-6 md:py-10">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Bar Skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>

        {/* Stepper Status Skeleton */}
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-4 w-36 mb-6" />
            <div className="hidden md:flex justify-between items-center gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <Skeleton className="h-7 w-7 rounded-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
            <div className="md:hidden space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-2.5 w-40" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 2-Column Content Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-6 space-y-4">
            <Card className="overflow-hidden">
              <Skeleton className="w-full aspect-video md:aspect-[4/3]" />
            </Card>
          </div>
          <div className="md:col-span-6 space-y-4">
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <div className="pt-3 border-t border-border space-y-2">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-4 w-44" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
