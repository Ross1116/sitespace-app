"use client";

import React, { useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type BackgroundRippleEffectProps = {
  rows?: number;
  cols?: number;
  cellSize?: number;
  fillContainer?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export const BackgroundRippleEffect = ({
  rows = 8,
  cols = 27,
  cellSize = 56,
  fillContainer = false,
  className,
  style,
}: BackgroundRippleEffectProps) => {
  const [clickedCell, setClickedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [rippleKey, setRippleKey] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);

  return (
    <>
      <div
        ref={ref}
        className={cn(
          "absolute inset-0 h-full w-full overflow-hidden",
          className,
        )}
        style={
          {
            "--cell-border-color": "rgba(14, 124, 155, 0.16)",
            "--cell-fill-color": "rgba(14, 124, 155, 0.04)",
            "--cell-ripple-color": "rgba(0, 78, 137, 0.14)",
            "--cell-shadow-color": "rgba(0, 78, 137, 0.22)",
            ...style,
          } as React.CSSProperties
        }
      >
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 z-[1]"
            style={{
              background:
                "radial-gradient(circle at top, rgba(255,255,255,0.42), transparent 42%), linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 34%, rgba(255,255,255,0.14) 100%)",
            }}
          />
          <DivGrid
            key={`ripple-grid-${rippleKey}`}
            className="relative z-[2] mx-auto [mask-image:radial-gradient(circle_at_center,rgba(0,0,0,1),rgba(0,0,0,0.92)_56%,rgba(0,0,0,0.46)_78%,transparent)]"
            rows={rows}
            cols={cols}
            cellSize={cellSize}
            fillContainer={fillContainer}
            borderColor="var(--cell-border-color)"
            fillColor="var(--cell-fill-color)"
            rippleColor="var(--cell-ripple-color)"
            clickedCell={clickedCell}
            onCellClick={(row, col) => {
              setClickedCell({ row, col });
              setRippleKey((current) => current + 1);
            }}
            interactive
          />
        </div>
      </div>

      <style jsx global>{`
        @keyframes cell-ripple {
          0% {
            opacity: calc(var(--ripple-strength, 1) * 0.24);
            transform: scale(1);
            background-color: var(--cell-fill-color);
            box-shadow:
              inset 0 1px 0 0 rgba(255, 255, 255, 0.18),
              inset 0 0 0 0 var(--cell-shadow-color),
              0 0 0 0 transparent;
          }

          32% {
            opacity: calc(var(--ripple-strength, 1) * 1);
            transform: scale(calc(0.92 + var(--ripple-strength, 1) * 0.02));
            background-color: var(--cell-ripple-color-soft);
            box-shadow:
              inset 0 1px 0 0 rgba(255, 255, 255, 0.5),
              inset 0 0 36px 2px var(--cell-shadow-color),
              0 0 14px 1px var(--cell-shadow-color);
          }

          68% {
            opacity: calc(var(--ripple-strength, 1) * 0.46);
            transform: scale(0.985);
            background-color: var(--cell-ripple-color);
            box-shadow:
              inset 0 1px 0 0 rgba(255, 255, 255, 0.22),
              inset 0 0 14px 0 rgba(255, 255, 255, 0.08),
              0 0 8px 0 rgba(255, 255, 255, 0.1),
              0 0 0 0 transparent;
          }

          100% {
            opacity: calc(var(--ripple-strength, 1) * 0.14);
            transform: scale(1.01);
            background-color: var(--cell-fill-color);
            box-shadow:
              inset 0 1px 0 0 rgba(255, 255, 255, 0.06),
              0 0 0 0 transparent;
          }
        }
      `}</style>
    </>
  );
};

type DivGridProps = {
  className?: string;
  rows: number;
  cols: number;
  cellSize: number;
  fillContainer?: boolean;
  borderColor: string;
  fillColor: string;
  rippleColor: string;
  clickedCell: { row: number; col: number } | null;
  onCellClick?: (row: number, col: number) => void;
  interactive?: boolean;
};

type CellStyle = React.CSSProperties & {
  ["--delay"]?: string;
  ["--duration"]?: string;
  ["--ripple-strength"]?: string;
};

const DivGrid = ({
  className,
  rows = 7,
  cols = 30,
  cellSize = 56,
  fillContainer = false,
  borderColor,
  fillColor,
  rippleColor,
  clickedCell = null,
  onCellClick = () => {},
  interactive = true,
}: DivGridProps) => {
  const cells = useMemo(
    () => Array.from({ length: rows * cols }, (_, idx) => idx),
    [rows, cols],
  );

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: fillContainer
      ? `repeat(${cols}, minmax(0, 1fr))`
      : `repeat(${cols}, ${cellSize}px)`,
    gridTemplateRows: fillContainer
      ? `repeat(${rows}, minmax(0, 1fr))`
      : `repeat(${rows}, ${cellSize}px)`,
    width: fillContainer ? "100%" : cols * cellSize,
    height: fillContainer ? "100%" : rows * cellSize,
    marginInline: "auto",
  };

  return (
    <div className={cn(className)} style={gridStyle}>
      {cells.map((idx) => {
        const rowIdx = Math.floor(idx / cols);
        const colIdx = idx % cols;
        const distance = clickedCell
          ? Math.hypot(clickedCell.row - rowIdx, clickedCell.col - colIdx)
          : 0;
        const maxDistance = Math.hypot(rows - 1, cols - 1) || 1;
        const normalizedDistance = Math.min(distance / maxDistance, 1);
        const rippleStrength = clickedCell
          ? Math.max(0.18, 1 - normalizedDistance * 1.35)
          : 1;
        const delay = clickedCell ? Math.max(0, distance * 48) : 0;
        const duration = 340 + distance * 130;

        const cellStyle: CellStyle = {
          backgroundColor: fillColor,
          borderColor,
        };

        if (clickedCell) {
          cellStyle["--delay"] = `${delay}ms`;
          cellStyle["--duration"] = `${duration}ms`;
          cellStyle["--ripple-strength"] = `${rippleStrength}`;
          cellStyle.animation = `cell-ripple var(--duration) cubic-bezier(0.12, 0.82, 0.22, 1) var(--delay)`;
        }

        return (
          <div
            key={idx}
            className={cn(
              "relative border-[0.5px] opacity-58 transition-all duration-150 will-change-transform",
              interactive &&
                "cursor-pointer hover:opacity-100 hover:scale-[0.975]",
              !interactive && "pointer-events-none",
            )}
            style={
              {
                ...cellStyle,
                ["--cell-ripple-color-soft" as string]:
                  "color-mix(in srgb, var(--cell-ripple-color) 48%, rgba(255,255,255,0.92))",
                ["--cell-ripple-color" as string]: rippleColor,
              } as React.CSSProperties
            }
            onClick={
              interactive ? () => onCellClick?.(rowIdx, colIdx) : undefined
            }
          />
        );
      })}
    </div>
  );
};
