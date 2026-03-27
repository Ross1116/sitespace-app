"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, RefreshCw, Upload } from "lucide-react";
import api from "@/lib/api";
import type { FileUploadResponse, SitePlan } from "@/types";
import { getApiErrorMessage } from "@/types";
import { toProxyUrl, validateSitePlanFile } from "@/lib/sitePlanUtils";

interface SitePlanUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  existingPlan?: SitePlan | null;
  onSuccess: (plan: SitePlan) => void;
}

export function SitePlanUploadDialog({
  isOpen,
  onClose,
  projectId,
  existingPlan,
  onSuccess,
}: SitePlanUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isUpdating = !!existingPlan;

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newFileId, setNewFileId] = useState<string | null>(null);
  const [newPreviewUrl, setNewPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setUploading(false);
      setSubmitting(false);
      setNewFileId(null);
      setNewPreviewUrl(null);
      setTitle(existingPlan?.title ?? "");
      setError(null);
    }
  }, [isOpen, existingPlan?.title]);

  const existingPreviewUrl = existingPlan
    ? toProxyUrl(existingPlan.file.preview_url)
    : null;

  const displayPreviewUrl = newPreviewUrl ?? existingPreviewUrl;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = "";

    const validationError = validateSitePlanFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post<FileUploadResponse>(
        "/files/upload",
        formData,
        {
          // Remove Content-Type so the browser sets multipart/form-data with the
          // correct boundary automatically. The axios instance default of
          // "application/json" would otherwise serialize FormData to JSON.
          transformRequest: (
            data: unknown,
            headers?: Record<string, string>,
          ) => {
            if (headers) {
              delete headers["Content-Type"];
              delete headers["content-type"];
            }
            return data;
          },
        },
      );

      const { file_id, suggested_title, preview_url } = res.data;
      setNewFileId(file_id);
      if (!isUpdating || !title) setTitle(suggested_title);
      setNewPreviewUrl(toProxyUrl(preview_url));
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to upload file"));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      let plan: SitePlan;
      if (isUpdating && existingPlan) {
        const payload: { title: string; file_id?: string } = {
          title: title.trim(),
        };
        if (newFileId) payload.file_id = newFileId;
        const res = await api.patch<SitePlan>(
          `/site-plans/${existingPlan.id}`,
          payload,
        );
        plan = res.data;
      } else {
        const res = await api.post<SitePlan>("/site-plans/", {
          title: title.trim(),
          file_id: newFileId,
          project_id: projectId,
        });
        plan = res.data;
      }
      onSuccess(plan);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to save site plan"));
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit =
    (isUpdating || !!newFileId) && !!title.trim() && !uploading && !submitting;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-md bg-white p-0 gap-0 border-slate-200 shadow-2xl overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 pr-14">
          <DialogTitle className="text-lg font-semibold text-slate-900">
            {isUpdating ? "Update Site Plan" : "Upload Site Plan"}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-6 space-y-5">
          {/* Preview / file picker area */}
          {displayPreviewUrl ? (
            <div className="space-y-3">
              <div className="relative w-full aspect-video bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                {uploading && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  </div>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={displayPreviewUrl}
                  alt="Site plan preview"
                  className="w-full h-full object-contain"
                />
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || submitting}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                {isUpdating ? "Replace file" : "Choose a different file"}
              </button>
            </div>
          ) : !uploading ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center gap-3 text-slate-500 hover:border-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <Upload className="h-8 w-8 opacity-60" />
              <div className="text-center">
                <p className="font-medium text-sm">Click to select a file</p>
                <p className="text-xs text-slate-400 mt-1">
                  PDF, PNG, JPG — max 20 MB
                </p>
              </div>
            </button>
          ) : (
            <div className="w-full border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              <p className="text-sm font-medium">Uploading file...</p>
            </div>
          )}

          {/* Title input */}
          {(isUpdating || displayPreviewUrl) && (
            <div className="space-y-2">
              <Label
                htmlFor="plan-title"
                className="text-sm font-medium text-slate-700"
              >
                Title
              </Label>
              <Input
                id="plan-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter plan title"
                className="border-slate-200"
                disabled={submitting}
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2 text-sm border border-red-100">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {(isUpdating || displayPreviewUrl) && (
          <div className="px-6 pb-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="border-slate-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="bg-navy hover:bg-(--navy-hover) text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : isUpdating ? (
                "Update Plan"
              ) : (
                "Upload Plan"
              )}
            </Button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          className="hidden"
          onChange={handleFileChange}
        />
      </DialogContent>
    </Dialog>
  );
}
