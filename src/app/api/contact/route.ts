import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const contactSchema = z.object({
  name:        z.string().min(2),
  email:       z.string().email(),
  company:     z.string().min(1),
  role:        z.string().min(1),
  phone:       z.string().optional(),
  projectSize: z.string().optional(),
  message:     z.string().optional(),
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildEmailHtml(data: z.infer<typeof contactSchema>): string {
  const rows = [
    ["Name",         escapeHtml(data.name)],
    ["Email",        escapeHtml(data.email)],
    ["Company",      escapeHtml(data.company)],
    ["Role",         escapeHtml(data.role)],
    ["Phone",        data.phone        ? escapeHtml(data.phone)        : "—"],
    ["Project Size", data.projectSize  ? escapeHtml(data.projectSize)  : "—"],
    ["Message",      data.message      ? escapeHtml(data.message)      : "—"],
  ];

  const tableRows = rows
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:8px 12px;font-weight:600;background:#f3f4f6;white-space:nowrap;border:1px solid #e5e7eb;">${label}</td>
        <td style="padding:8px 12px;border:1px solid #e5e7eb;">${value}</td>
      </tr>`,
    )
    .join("");

  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#1f2937;">New Demo Request — SiteSpace</h2>
      <table style="border-collapse:collapse;width:100%;font-size:14px;">
        ${tableRows}
      </table>
      <p style="margin-top:24px;color:#6b7280;font-size:12px;">
        Sent from sitespace.com.au demo request form.
      </p>
    </div>
  `;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const result = contactSchema.safeParse(body);
  if (!result.success) {
    const first = result.error.issues[0]?.message ?? "Invalid submission";
    return NextResponse.json({ error: first }, { status: 400 });
  }

  const data = result.data;

  const apiToken   = process.env.MAILTRAP_TOKEN;
  const toEmail    = process.env.CONTACT_TO_EMAIL;
  const useSandbox = process.env.MAILTRAP_USE_SANDBOX?.toLowerCase() !== "false";
  const inboxId    = process.env.MAILTRAP_INBOX_ID;
  const fromEmail  = process.env.FROM_EMAIL ?? "noreply@sitespace.com.au";
  const fromName   = process.env.FROM_NAME  ?? "SiteSpace";

  if (!apiToken || !toEmail) {
    if (process.env.NODE_ENV === "production") {
      console.error("[contact] MAILTRAP_TOKEN or CONTACT_TO_EMAIL not configured in production");
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
    }
    console.debug("[contact] Delivery skipped — no credentials configured (dev/sandbox mode)");
    return NextResponse.json({ ok: true });
  }

  if (useSandbox && !inboxId) {
    if (process.env.NODE_ENV === "production") {
      console.error("[contact] MAILTRAP_USE_SANDBOX=true but MAILTRAP_INBOX_ID not set in production");
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
    }
    console.debug("[contact] Delivery skipped — sandbox mode but MAILTRAP_INBOX_ID not set");
    return NextResponse.json({ ok: true });
  }

  const url = useSandbox
    ? `https://sandbox.api.mailtrap.io/api/send/${inboxId}`
    : "https://send.api.mailtrap.io/api/send";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(useSandbox
      ? { "Api-Token": apiToken }
      : { Authorization: `Bearer ${apiToken}` }),
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  let mailtrapRes: Response;
  try {
    mailtrapRes = await fetch(url, {
      method: "POST",
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        from:     { email: fromEmail, name: fromName },
        to:       [{ email: toEmail }],
        reply_to: [{ email: data.email, name: data.name }],
        subject:  `Demo request — ${data.name} (${data.company})`,
        html:     buildEmailHtml(data),
        text:     "Please view this email in an HTML compatible client.",
        category: "Transactional",
      }),
    });
  } catch (err) {
    clearTimeout(timeout);
    const isTimeout = err instanceof Error && err.name === "AbortError";
    console.error("[contact] Mailtrap fetch error:", err);
    return NextResponse.json(
      { error: isTimeout ? "Email service timed out. Please try again." : "Failed to send email. Please try again." },
      { status: 500 },
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!mailtrapRes.ok) {
    const errBody = (await mailtrapRes.json().catch(() => ({}))) as { message?: string };
    console.error("[contact] Mailtrap error:", errBody);
    return NextResponse.json(
      { error: "Failed to send email. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
