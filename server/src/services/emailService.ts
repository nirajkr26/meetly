import { Resend } from "resend";
import { formatDateTimeForEmail } from "../utils/bookingHelpers";

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL;
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export function isEmailConfigured(): boolean {
  return Boolean(resend && fromEmail);
}

type MeetingEmailContext = {
  inviteeName: string;
  inviteeEmail: string;
  hostName: string;
  hostEmail: string;
  eventName: string;
  startTime: string;
  endTime: string;
  duration: number;
  hostTimezone: string;
  slug: string;
};

function buildMeetingTimeBlock(ctx: MeetingEmailContext): string {
  const when = formatDateTimeForEmail(ctx.startTime, ctx.hostTimezone);
  return `
    <p><strong>Event:</strong> ${ctx.eventName}</p>
    <p><strong>When:</strong> ${when}</p>
    <p><strong>Duration:</strong> ${ctx.duration} minutes</p>
    <p><strong>Host:</strong> ${ctx.hostName}</p>
  `;
}

async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  if (!resend || !fromEmail) {
    console.warn("Email skipped: RESEND_API_KEY or RESEND_FROM_EMAIL not set");
    return;
  }

  const { error } = await resend.emails.send({
    from: fromEmail,
    to,
    subject,
    html,
  });

  if (error) {
    console.error("Resend error:", error);
    throw new Error(error.message);
  }
}

export async function sendBookingConfirmationEmails(
  ctx: MeetingEmailContext
): Promise<void> {
  const bookUrl = `${frontendUrl}/book/${ctx.slug}`;
  const body = buildMeetingTimeBlock(ctx);

  await sendEmail(
    ctx.inviteeEmail,
    `Confirmed: ${ctx.eventName} with ${ctx.hostName}`,
    `
      <h2>You're scheduled!</h2>
      <p>Hi ${ctx.inviteeName},</p>
      <p>Your meeting with <strong>${ctx.hostName}</strong> is confirmed.</p>
      ${body}
      <p><a href="${bookUrl}">Schedule another meeting</a></p>
    `
  );

  await sendEmail(
    ctx.hostEmail,
    `New booking: ${ctx.eventName} with ${ctx.inviteeName}`,
    `
      <h2>New meeting booked</h2>
      <p><strong>Invitee:</strong> ${ctx.inviteeName} (${ctx.inviteeEmail})</p>
      ${body}
      <p><a href="${frontendUrl}/dashboard/meetings">View in dashboard</a></p>
    `
  );
}

export async function sendCancellationEmails(
  ctx: MeetingEmailContext & { reason?: string }
): Promise<void> {
  const body = buildMeetingTimeBlock(ctx);
  const reasonBlock = ctx.reason
    ? `<p><strong>Reason:</strong> ${ctx.reason}</p>`
    : "";

  await sendEmail(
    ctx.inviteeEmail,
    `Cancelled: ${ctx.eventName} with ${ctx.hostName}`,
    `
      <h2>Meeting cancelled</h2>
      <p>Hi ${ctx.inviteeName},</p>
      <p>Your meeting with <strong>${ctx.hostName}</strong> has been cancelled.</p>
      ${body}
      ${reasonBlock}
      <p><a href="${frontendUrl}/book/${ctx.slug}">Book a new time</a></p>
    `
  );

  await sendEmail(
    ctx.hostEmail,
    `Cancelled: ${ctx.eventName} with ${ctx.inviteeName}`,
    `
      <h2>Meeting cancelled</h2>
      <p>The meeting with <strong>${ctx.inviteeName}</strong> was cancelled.</p>
      ${body}
      ${reasonBlock}
    `
  );
}

export async function sendRescheduleEmails(
  ctx: MeetingEmailContext & { previousStartTime: string }
): Promise<void> {
  const newWhen = formatDateTimeForEmail(ctx.startTime, ctx.hostTimezone);
  const oldWhen = formatDateTimeForEmail(ctx.previousStartTime, ctx.hostTimezone);

  const body = `
    <p><strong>Event:</strong> ${ctx.eventName}</p>
    <p><strong>Previous time:</strong> <s>${oldWhen}</s></p>
    <p><strong>New time:</strong> ${newWhen}</p>
    <p><strong>Duration:</strong> ${ctx.duration} minutes</p>
  `;

  await sendEmail(
    ctx.inviteeEmail,
    `Rescheduled: ${ctx.eventName} with ${ctx.hostName}`,
    `
      <h2>Meeting rescheduled</h2>
      <p>Hi ${ctx.inviteeName},</p>
      <p>Your meeting with <strong>${ctx.hostName}</strong> has a new time.</p>
      ${body}
    `
  );

  await sendEmail(
    ctx.hostEmail,
    `Rescheduled: ${ctx.eventName} with ${ctx.inviteeName}`,
    `
      <h2>Meeting rescheduled</h2>
      <p>Meeting with <strong>${ctx.inviteeName}</strong> was updated.</p>
      ${body}
      <p><a href="${frontendUrl}/dashboard/meetings">View in dashboard</a></p>
    `
  );
}

// Fire-and-forget — never fail the HTTP request because email failed 
export function sendEmailSafe(promise: Promise<void>): void {
  promise.catch((err) => console.error("Email delivery failed:", err));
}
