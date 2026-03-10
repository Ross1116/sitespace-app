"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { z } from "zod";
import { X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

// ── validation ────────────────────────────────────────────────────────────────
const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid work email"),
  company: z.string().min(1, "Company name is required"),
  role: z.string().min(1, "Please select your role"),
  phone: z.string().optional(),
  projectSize: z.string().optional(),
  message: z.string().optional(),
});

type ContactFields = z.infer<typeof contactSchema>;

const ROLES = [
  "Project Manager",
  "Site Manager",
  "Construction Manager",
  "Developer / Builder",
  "Subcontractor",
  "Other",
];

const PROJECT_SIZES = [
  "Small  (< 50 units / residential)",
  "Medium (50–200 units)",
  "Large  (200+ units / commercial)",
  "Infrastructure / civil",
];

// ── sub-components ────────────────────────────────────────────────────────────
function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-semibold text-gray-300">
        {label}
        {required && <span className="text-amber-400 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-[11px] text-red-400 flex items-center gap-1">
          <AlertCircle size={11} />
          {error}
        </p>
      )}
    </div>
  );
}

const inputCls =
  "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-amber-500/60 focus:bg-white/8 transition-colors";

const selectCls =
  "w-full bg-[#0d0d1a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/60 transition-colors appearance-none cursor-pointer";

// ── main modal ────────────────────────────────────────────────────────────────
function ContactModalContent({ onClose }: { onClose: () => void }) {
  const [fields, setFields] = useState<Partial<ContactFields>>({});
  const [errors, setErrors] = useState<
    Partial<Record<keyof ContactFields, string>>
  >({});
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [serverError, setServerError] = useState("");

  const set =
    (key: keyof ContactFields) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      setFields((prev) => ({ ...prev, [key]: e.target.value }));
      if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = contactSchema.safeParse(fields);
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof ContactFields;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setStatus("submitting");
    setServerError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Something went wrong");
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setServerError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    }
  };

  // ── success state ──────────────────────────────────────────────────────────
  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-5">
          <CheckCircle2 size={32} className="text-amber-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Request received</h3>
        <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
          Thanks for reaching out. We&apos;ll be in touch within one to three
          business days to schedule your demo.
        </p>
        <button
          onClick={onClose}
          className="mt-8 px-6 py-2.5 bg-amber-500 text-black rounded-full text-sm font-semibold hover:bg-amber-400 transition-colors"
        >
          Close
        </button>
      </div>
    );
  }

  // ── form ───────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Full Name" required error={errors.name}>
          <input
            type="text"
            autoComplete="name"
            placeholder="Alex Smith"
            value={fields.name ?? ""}
            onChange={set("name")}
            className={inputCls}
          />
        </Field>

        <Field label="Work Email" required error={errors.email}>
          <input
            type="email"
            autoComplete="email"
            placeholder="alex@company.com.au"
            value={fields.email ?? ""}
            onChange={set("email")}
            className={inputCls}
          />
        </Field>

        <Field label="Company" required error={errors.company}>
          <input
            type="text"
            autoComplete="organization"
            placeholder="Your company"
            value={fields.company ?? ""}
            onChange={set("company")}
            className={inputCls}
          />
        </Field>

        <Field label="Your Role" required error={errors.role}>
          <select
            value={fields.role ?? ""}
            onChange={set("role")}
            className={selectCls}
          >
            <option value="" disabled>
              Select role…
            </option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Phone" error={errors.phone}>
          <input
            type="tel"
            autoComplete="tel"
            placeholder="+61 4xx xxx xxx"
            value={fields.phone ?? ""}
            onChange={set("phone")}
            className={inputCls}
          />
        </Field>

        <Field label="Project Size" error={errors.projectSize}>
          <select
            value={fields.projectSize ?? ""}
            onChange={set("projectSize")}
            className={selectCls}
          >
            <option value="">Select size… (optional)</option>
            {PROJECT_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-4">
        <Field
          label="Anything else you'd like us to know?"
          error={errors.message}
        >
          <textarea
            rows={3}
            placeholder="Tell us about your project, timeline, or specific challenges…"
            value={fields.message ?? ""}
            onChange={set("message")}
            className={`${inputCls} resize-none`}
          />
        </Field>
      </div>

      {status === "error" && (
        <p className="mt-4 text-sm text-red-400 flex items-center gap-2">
          <AlertCircle size={14} />
          {serverError}
        </p>
      )}

      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 rounded-full text-sm font-semibold text-gray-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={status === "submitting"}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-amber-500 text-black rounded-full text-sm font-semibold hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
        >
          {status === "submitting" && (
            <Loader2 size={14} className="animate-spin" />
          )}
          {status === "submitting" ? "Sending…" : "Request a Demo"}
        </button>
      </div>
    </form>
  );
}

// ── exported trigger component ────────────────────────────────────────────────
export function DemoRequestCTA({
  label = "Book a Demo",
  className,
}: {
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" className={className}>
          {label}
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-[#0a0a14] p-6 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=open]:slide-in-from-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-top-[48%] max-h-[90vh] overflow-y-auto">
          <div className="flex items-start justify-between mb-6">
            <div>
              <Dialog.Title className="text-xl font-bold text-white">
                Book a Demo
              </Dialog.Title>
              <Dialog.Description className="text-sm text-gray-400 mt-1">
                Tell us about your project and we&apos;ll reach out within one
                to three business days.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                className="text-gray-600 hover:text-white transition-colors mt-0.5 flex-shrink-0"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          <ContactModalContent onClose={() => setOpen(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
