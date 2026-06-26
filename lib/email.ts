import nodemailer from "nodemailer";

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const from = process.env.SMTP_FROM ?? "noreply@keevanstore.in";
  const transporter = getTransporter();

  if (!transporter) {
    return { ok: false, error: "SMTP is not configured" };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });

    return { ok: true, id: info.messageId };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error sending email";
    return { ok: false, error: message };
  }
}
