"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Download,
  Edit,
  Loader2,
  Maximize2,
  Minus,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import api from "@/lib/api";
import type { SitePlan } from "@/types";
import { getApiErrorMessage } from "@/types";
import { toProxyUrl } from "@/lib/sitePlanUtils";
import { SitePlanUploadDialog } from "./SitePlanUploadDialog";

interface SitePlanViewerDialogProps {
  plan: SitePlan | null;
  isOpen: boolean;
  onClose: () => void;
  canEdit: boolean;
  projectId: string;
  onUpdated: (plan: SitePlan) => void;
  onDeleted: (planId: string) => void;
}

const MIN_SCALE = 0.05;
const MAX_SCALE = 16;
const ZOOM_STEP = 0.3;

// ─── Full-screen lightbox ────────────────────────────────────────────────────

interface LightboxProps {
  src: string;
  alt: string;
  title: string;
  filename: string;
  isOpen: boolean;
  onClose: () => void;
}

function ImageLightbox({
  src,
  alt,
  title,
  filename,
  isOpen,
  onClose,
}: LightboxProps) {
  const [scale, setScaleState] = useState(1);
  const [offset, setOffsetState] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const scaleRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastTouchDistRef = useRef<number | null>(null);

  const applyScale = (s: number) => {
    scaleRef.current = s;
    setScaleState(s);
  };
  const applyOffset = (o: { x: number; y: number }) => {
    offsetRef.current = o;
    setOffsetState(o);
  };

  const resetView = useCallback(() => {
    applyScale(1);
    applyOffset({ x: 0, y: 0 });
  }, []);

  // Reset view when opened
  useEffect(() => {
    if (isOpen) resetView();
  }, [isOpen, resetView]);

  // Non-passive wheel zoom (cursor-centred)
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !isOpen) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left - rect.width / 2;
      const cy = e.clientY - rect.top - rect.height / 2;
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      const newScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, scaleRef.current * factor),
      );
      const ratio = newScale / scaleRef.current;
      applyScale(newScale);
      applyOffset({
        x: cx - ratio * (cx - offsetRef.current.x),
        y: cy - ratio * (cy - offsetRef.current.y),
      });
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [isOpen]);

  // Keyboard shortcuts for zoom (+/-, 0). Escape is handled by Radix.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "=" || e.key === "+")
        applyScale(Math.min(MAX_SCALE, scaleRef.current + ZOOM_STEP));
      else if (e.key === "-")
        applyScale(Math.max(MIN_SCALE, scaleRef.current - ZOOM_STEP));
      else if (e.key === "0") resetView();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, resetView]);

  // Mouse drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - offsetRef.current.x,
      y: e.clientY - offsetRef.current.y,
    };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    applyOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };
  const stopDrag = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  // Touch: single finger = pan, two fingers = pinch zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX - offsetRef.current.x,
        y: e.touches[0].clientY - offsetRef.current.y,
      };
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      dragStartRef.current = null;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDistRef.current = Math.sqrt(dx * dx + dy * dy);
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging && dragStartRef.current) {
      applyOffset({
        x: e.touches[0].clientX - dragStartRef.current.x,
        y: e.touches[0].clientY - dragStartRef.current.y,
      });
    } else if (
      e.touches.length === 2 &&
      lastTouchDistRef.current !== null
    ) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDist = Math.sqrt(dx * dx + dy * dy);
      applyScale(
        Math.min(
          MAX_SCALE,
          Math.max(
            MIN_SCALE,
            scaleRef.current * (newDist / lastTouchDistRef.current),
          ),
        ),
      );
      lastTouchDistRef.current = newDist;
    }
  };
  const handleTouchEnd = () => {
    setIsDragging(false);
    dragStartRef.current = null;
    lastTouchDistRef.current = null;
  };

  // Use Radix Dialog primitives so Radix's DismissableLayer stack tracks this as
  // a nested layer — the outer viewer dialog won't close when the lightbox closes.
  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-[9999] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 duration-200"
          style={{ background: "rgba(0,0,0,0.93)" }}
        />
        <DialogPrimitive.Content
          className="fixed inset-0 z-[9999] flex flex-col outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 duration-200"
          // Prevent Radix from auto-closing this content on outside pointer/focus events
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>

          {/* ── Top bar ── */}
          <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
            <div className="min-w-0 pointer-events-auto">
              <p className="text-white font-semibold text-sm truncate leading-tight">
                {title}
              </p>
              <p className="text-white/40 text-xs truncate mt-0.5">{filename}</p>
            </div>
            <DialogPrimitive.Close asChild>
              <button
                className="pointer-events-auto flex-shrink-0 ml-4 w-9 h-9 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/15 transition-colors"
                aria-label="Close lightbox"
              >
                <X className="h-5 w-5" />
              </button>
            </DialogPrimitive.Close>
          </div>

          {/* ── Image canvas ── */}
          <div
            ref={containerRef}
            className="flex-1 overflow-hidden select-none"
            style={{
              cursor: isDragging ? "grabbing" : "grab",
              touchAction: "none",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={stopDrag}
            onMouseLeave={stopDrag}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onDoubleClick={resetView}
          >
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                transformOrigin: "center center",
                willChange: "transform",
                transition: isDragging ? "none" : "transform 0.05s ease-out",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={alt}
                draggable={false}
                className="max-w-full max-h-full object-contain pointer-events-none select-none"
                style={{ maxHeight: "calc(100vh - 130px)" }}
              />
            </div>
          </div>

          {/* ── Bottom toolbar ── */}
          <div
            className="flex-shrink-0 py-5 flex justify-center gap-3"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-0.5 bg-white/10 backdrop-blur-md px-2 py-1.5 rounded-full border border-white/10 shadow-2xl">
              <button
                className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15 rounded-full transition-colors"
                onClick={() =>
                  applyScale(Math.max(MIN_SCALE, scaleRef.current - ZOOM_STEP))
                }
                title="Zoom out (−)"
              >
                <Minus className="h-4 w-4" />
              </button>

              <button
                className="min-w-[3.5rem] text-white/85 text-xs font-mono text-center hover:bg-white/10 rounded-full px-2 py-1 transition-colors"
                onClick={resetView}
                title="Reset zoom (0)"
              >
                {Math.round(scale * 100)}%
              </button>

              <button
                className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15 rounded-full transition-colors"
                onClick={() =>
                  applyScale(Math.min(MAX_SCALE, scaleRef.current + ZOOM_STEP))
                }
                title="Zoom in (+)"
              >
                <Plus className="h-4 w-4" />
              </button>

              <div className="w-px h-4 bg-white/20 mx-1" />

              {[1, 2, 4].map((z) => (
                <button
                  key={z}
                  className={`text-[11px] font-medium px-2 py-1 rounded-full transition-colors ${
                    Math.round(scale * 100) === z * 100
                      ? "bg-white/25 text-white"
                      : "text-white/50 hover:text-white hover:bg-white/15"
                  }`}
                  onClick={() => {
                    applyScale(z);
                    applyOffset({ x: 0, y: 0 });
                  }}
                  title={`${z * 100}%`}
                >
                  {z}×
                </button>
              ))}

              <div className="w-px h-4 bg-white/20 mx-1" />

              <button
                className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15 rounded-full transition-colors"
                onClick={resetView}
                title="Fit to view (0)"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

// ─── Viewer dialog ────────────────────────────────────────────────────────────

export function SitePlanViewerDialog({
  plan,
  isOpen,
  onClose,
  canEdit,
  projectId,
  onUpdated,
  onDeleted,
}: SitePlanViewerDialogProps) {
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!plan) return null;

  const imageUrl = toProxyUrl(plan.file.image_url);
  const rawUrl = toProxyUrl(plan.file.raw_url);

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.delete(`/site-plans/${plan.id}`);
      setIsDeleteConfirmOpen(false);
      onDeleted(plan.id);
      onClose();
    } catch (err) {
      setDeleteError(getApiErrorMessage(err, "Failed to delete site plan"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-2xl bg-white p-0 gap-0 border-slate-200 shadow-2xl overflow-hidden">
          {/* Header */}
          <DialogHeader className="px-6 pt-5 pb-4 border-b border-slate-100 pr-14">
            <DialogTitle className="text-base font-semibold text-slate-900 truncate">
              {plan.title}
            </DialogTitle>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {plan.file.original_filename}
            </p>
          </DialogHeader>

          {/* Clickable image — click opens the lightbox */}
          <div
            role="button"
            tabIndex={0}
            aria-label={`View ${plan.title} in full screen`}
            className="relative group cursor-zoom-in overflow-hidden bg-slate-900"
            style={{ height: "55vh" }}
            onClick={() => setLightboxOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setLightboxOpen(true);
              }
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={plan.title}
              draggable={false}
              className="w-full h-full object-contain pointer-events-none select-none"
            />
            {/* Expand hint on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-all duration-200">
              <div className="opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-200 bg-black/55 backdrop-blur-sm rounded-full p-3.5">
                <Maximize2 className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
            <div className="flex gap-2">
              {canEdit && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-200 text-slate-700"
                    onClick={() => setIsUpdateOpen(true)}
                  >
                    <Edit className="h-4 w-4 mr-1.5" /> Update
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => setIsDeleteConfirmOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" /> Delete
                  </Button>
                </>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-200 text-slate-700"
              asChild
            >
              <a href={rawUrl} target="_blank" rel="noreferrer">
                <Download className="h-4 w-4 mr-1.5" /> Download
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full-screen lightbox — Radix Dialog so layer stack is managed correctly */}
      <ImageLightbox
        src={imageUrl}
        alt={plan.title}
        title={plan.title}
        filename={plan.file.original_filename}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={isDeleteConfirmOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsDeleteConfirmOpen(false);
            setDeleteError(null);
          }
        }}
      >
        <AlertDialogContent className="w-[calc(100vw-1rem)] bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Site Plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{plan.title}&quot; and its
              file. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="text-red-600 text-sm px-1">{deleteError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Update dialog */}
      <SitePlanUploadDialog
        isOpen={isUpdateOpen}
        onClose={() => setIsUpdateOpen(false)}
        projectId={projectId}
        existingPlan={plan}
        onSuccess={(updatedPlan) => {
          setIsUpdateOpen(false);
          onUpdated(updatedPlan);
          onClose();
        }}
      />
    </>
  );
}
