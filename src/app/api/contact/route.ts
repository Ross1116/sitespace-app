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

function buildEmailHtml(data: z.infer<typeof contactSchema>): string {
  const rows = [
    ["Name",         data.name],
    ["Email",        data.email],
    ["Company",      data.company],
    ["Role",         data.role],
    ["Phone",        data.phone        ?? "—"],
    ["Project Size", data.projectSize  ?? "—"],
    ["Message",      data.message      ?? "—"],
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
    console.info("[contact] Demo request received (no Mailtrap token configured):", data);
    return NextResponse.json({ ok: true });
  }

  if (useSandbox && !inboxId) {
    console.warn("[contact] MAILTRAP_USE_SANDBOX=true but MAILTRAP_INBOX_ID not set");
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

  const mailtrapRes = await fetch(url, {
    method: "POST",
    headers,
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
