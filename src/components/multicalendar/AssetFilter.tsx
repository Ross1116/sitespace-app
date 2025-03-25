"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { AssetCalendar } from "@/lib/multicalendarHelpers";

interface AssetFilterProps {
  isCollapsed: boolean;
  loading: boolean;
  assetCalendars: AssetCalendar[];
  visibleAssets: number[];
  setVisibleAssets: React.Dispatch<React.SetStateAction<number[]>>;
}

export function AssetFilter({
  isCollapsed,
  loading,
  assetCalendars,
  visibleAssets,
  setVisibleAssets,
}: AssetFilterProps) {
  // Function to toggle asset visibility
  const toggleAssetVisibility = (assetIndex: number) => {
    setVisibleAssets((prevVisible) => {
      if (prevVisible.includes(assetIndex)) {
        // Remove asset if already visible
        return prevVisible.filter((index) => index !== assetIndex);
      } else {
        // Add asset if not visible
        return [...prevVisible, assetIndex];
      }
    });
  };

  return (
    <Card
      className={`${
        isCollapsed ? "lg:hidden" : "col-span-3 lg:flex"
      } row-span-3 overflow-hidden hidden bg-amber-50 rounded-2xl transition-all duration-600 px-4`}
    >
      <CardHeader>
        <CardTitle>Assets Filter</CardTitle>
        <CardDescription>
          Choose which assets you would like to view
        </CardDescription>
      </CardHeader>
      <CardContent className="-mt-2 overflow-auto">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        ) : assetCalendars.length === 0 ? (
          <p>No assets available</p>
        ) : (
          <div className="flex flex-col justify-evenly space-y-2">
            {assetCalendars.map((calendar, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`asset-${index}`}
                  checked={visibleAssets.includes(index)}
                  onCheckedChange={() => toggleAssetVisibility(index)}
                  className="data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                />
                <label
                  htmlFor={`asset-${index}`}
                  className="text-sm font-medium text-gray-700"
                >
                  {calendar.name}
                </label>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}