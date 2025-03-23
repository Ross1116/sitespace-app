"use client";

import { cva } from "class-variance-authority";

// Move these variant definitions here from the context file
export const monthEventVariants = cva("size-2 rounded-full", {
  variants: {
    variant: {
      default: "bg-primary",
      blue: "bg-blue-500",
      green: "bg-green-500",
      pink: "bg-pink-500",
      purple: "bg-purple-500",
      yellow: "bg-yello-500",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export const dayEventVariants = cva("font-bold border-l-4 rounded p-2 text-xs", {
  variants: {
    variant: {
      default: "bg-muted/30 text-muted-foreground border-muted",
      blue: "bg-blue-500/30 text-blue-600 border-blue-500",
      green: "bg-green-500/30 text-green-600 border-green-500",
      pink: "bg-pink-500/30 text-pink-600 border-pink-500",
      purple: "bg-purple-500/30 text-purple-600 border-purple-500",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export const TimeTable = () => {
  const now = new Date();

  return (
    <div className="pr-2 w-12 ">
      {Array.from(Array(15)).map((_, index) => {
        const hour = index + 6;
        return (
          <div
            className="text-right relative text-xs text-gray-800 h-12 last:h-0"
            key={hour}
          >
            {now.getHours() === hour && (
              <div
                className="absolute left-full translate-x-2 w-dvw h-[2px] bg-red-500"
                style={{
                  top: `${(now.getMinutes() / 60) * 100}%`,
                }}
              >
                <div className="size-2 rounded-full bg-red-500 absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2"></div>
              </div>
            )}
            <p className="top-0 -translate-y-1/2">{hour}:00</p>
          </div>
        );
      })}
    </div>
  );
};