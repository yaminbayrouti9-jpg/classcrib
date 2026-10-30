type EmailMessage = { to: string; subject: string; html: string };

export async function sendSchoolEmail(message: EmailMessage): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.SCHOOL_EMAIL_FROM;
  if (!apiKey || !from) return false;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, ...message }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(`School email provider returned ${response.status}: ${responseBody.slice(0, 500)}`);
  }
  return true;
}
