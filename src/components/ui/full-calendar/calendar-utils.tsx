"use client";

import { cva } from "class-variance-authority";

// Tiny dots for month view
export const monthEventVariants = cva("size-1.5 rounded-full", {
  variants: {
    variant: {
      default: "bg-slate-400",
      blue: "bg-blue-600",
      green: "bg-emerald-600",
      pink: "bg-rose-600",
      purple: "bg-violet-600",
      yellow: "bg-amber-500",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

// Block events for day/week view
export const dayEventVariants = cva(
  "font-medium border-l-[3px] rounded-r-md px-2 py-1 text-xs transition-colors shadow-sm",
  {
    variants: {
      variant: {
        default: "bg-slate-100 text-slate-600 border-slate-400 hover:bg-slate-200",
        blue: "bg-sky-50 text-sky-700 border-sky-500 hover:bg-sky-100", 
        green: "bg-emerald-50 text-emerald-700 border-emerald-500 hover:bg-emerald-100", 
        pink: "bg-rose-50 text-rose-700 border-rose-500 hover:bg-rose-100", 
        purple: "bg-violet-50 text-violet-700 border-violet-500 hover:bg-violet-100",
        yellow: "bg-amber-50 text-amber-700 border-amber-400 hover:bg-amber-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export const TimeTable = () => {
  const now = new Date();

  return (
    <div className="pr-2 w-12 border-r border-slate-100 bg-slate-50">
      {Array.from(Array(15)).map((_, index) => {
        const hour = index + 6;
        return (
          <div
            className="text-right relative text-xs text-slate-400 font-medium h-12 last:h-0"
            key={hour}
          >
            {now.getHours() === hour && (
              <div
                className="absolute left-full translate-x-0 w-screen h-[2px] bg-[#0B1120] z-50 pointer-events-none"
                style={{ top: `${(now.getMinutes() / 60) * 100}%` }}
              >
                <div className="size-2 rounded-full bg-[#0B1120] absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2"></div>
              </div>
            )}
            <p className="top-0 -translate-y-1/2 pr-2">{hour}:00</p>
          </div>
        );
      })}
    </div>
  );
};