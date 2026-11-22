import { Resend } from "resend";
import { supabaseAdmin } from "./supabase-admin";
import { formatNaira } from "./utils";

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

// Admin recipient for new order alerts
const ADMIN_NOTIFICATION_EMAIL = "akpemekelly02@gmail.com";

interface OrderItemProduct {
  name: string;
}

interface OrderItemRow {
  quantity: number;
  price_at_time: number;
  products: OrderItemProduct | null;
}

interface OrderDetails {
  id: string;
  customer_name: string;
  customer_email: string;
  shipping_address: string;
  total_amount: number;
  payment_reference: string | null;
  created_at: string;
  order_items: OrderItemRow[];
}

const EMAIL_HEADER = `
  <div style="border-bottom: 1px solid #111111; padding-bottom: 20px; margin-bottom: 30px;">
    <span style="font-size: 10px; letter-spacing: 0.25em; text-transform: uppercase; color: #737373;">Official Acquisition</span>
    <h1 style="font-size: 26px; font-weight: 300; letter-spacing: 0.05em; margin: 6px 0 0 0; color: #111111;">TWOM</h1>
  </div>
`;

const EMAIL_FOOTER = `
  <div style="border-top: 1px solid #e5e5e5; padding-top: 24px; margin-top: 32px; font-size: 11px; color: #a3a3a3; text-align: center;">
    TWOM Atelier &bull; If you have any inquiries, reply directly to this notice.
  </div>
`;

function wrapEmail(body: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"></head>
      <body style="margin: 0; padding: 40px 16px; background-color: #f7f6f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e5e5; padding: 40px;">
          ${EMAIL_HEADER}
          ${body}
          ${EMAIL_FOOTER}
        </div>
      </body>
    </html>
  `;
}

export async function sendOrderConfirmation(orderId: string) {
  const resend = getResendClient();
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY is not configured. Skipping email notifications.");
    return;
  }

  try {
    const { data: rawOrder, error } = await supabaseAdmin
      .from("orders")
      .select(`
        id,
        customer_name,
        customer_email,
        shipping_address,
        total_amount,
        payment_reference,
        created_at,
        order_items (
          quantity,
          price_at_time,
          products ( name )
        )
      `)
      .eq("id", orderId)
      .single();

    if (error || !rawOrder) {
      console.error("[Email] Failed to fetch order details for notifications:", error);
      return;
    }

    const order = rawOrder as unknown as OrderDetails;

    const itemsHtml = order.order_items
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; font-size: 13px; color: #1a1a1a;">
            ${item.quantity}× ${item.products?.name ?? "Piece"}
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; text-align: right; font-size: 13px; font-weight: 500; color: #1a1a1a;">
            ${formatNaira(item.price_at_time * item.quantity)}
          </td>
        </tr>`
      )
      .join("");

    const body = `
      <p style="font-size: 14px; color: #111111; margin-bottom: 8px;">Dear ${order.customer_name},</p>
      <p style="font-size: 13px; color: #737373; line-height: 1.6; margin-bottom: 28px;">
        Your acquisition has been confirmed and recorded. Our atelier is currently preparing your pieces for dispatch.
      </p>

      <div style="background-color: #fafafa; border: 1px solid #eeeeee; padding: 14px; margin-bottom: 28px;">
        <table style="width: 100%; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #737373;">
          <tr>
            <td>Order Reference:</td>
            <td style="text-align: right; font-family: monospace; color: #111111;">${order.id.slice(0, 8)}</td>
          </tr>
          <tr>
            <td style="padding-top: 6px;">Payment:</td>
            <td style="padding-top: 6px; text-align: right; color: #15803d; font-weight: 600;">Confirmed (Paid)</td>
          </tr>
        </table>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        ${itemsHtml}
        <tr>
          <td style="padding: 16px 0 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; color: #737373;">Total Paid</td>
          <td style="padding: 16px 0 0 0; font-size: 18px; font-weight: 600; text-align: right; color: #111111;">${formatNaira(order.total_amount)}</td>
        </tr>
      </table>

      <div style="border-top: 1px solid #e5e5e5; padding-top: 20px; margin-top: 24px;">
        <span style="font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #737373; display: block; margin-bottom: 6px;">Shipping Destination</span>
        <p style="font-size: 12px; color: #404040; margin: 0; line-height: 1.5;">${order.shipping_address}</p>
      </div>
    `;

    const emailHtml = wrapEmail(body);

    const results = await Promise.allSettled([
      resend.emails.send({
        from: "TWOM <onboarding@resend.dev>",
        to: order.customer_email,
        subject: `Order Confirmed: ${order.id.slice(0, 8)} - TWOM`,
        html: emailHtml,
      }),
      resend.emails.send({
        from: "TWOM System <onboarding@resend.dev>",
        to: ADMIN_NOTIFICATION_EMAIL,
        subject: `💰 New Order: ${formatNaira(order.total_amount)} (${order.customer_name})`,
        html: emailHtml,
      }),
    ]);

    results.forEach((result, idx) => {
      const target = idx === 0 ? `Customer (${order.customer_email})` : `Admin (${ADMIN_NOTIFICATION_EMAIL})`;
      if (result.status === "fulfilled") {
        console.log(`[Email] Successfully sent to ${target}`);
      } else {
        console.warn(`[Email] Could not deliver to ${target}:`, result.reason);
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Email] Unexpected error during notification dispatch:", message);
  }
}

// ── Dispatch Notification ───────────────────────────────────────────────────

interface DispatchEmailParams {
  customerName: string;
  customerEmail: string;
  orderId: string;
  courierName: string;
  trackingNumber: string;
  trackingUrl: string | null;
}

export async function sendDispatchNotification(params: DispatchEmailParams) {
  const resend = getResendClient();
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY is not configured. Skipping dispatch email.");
    return;
  }

  const { customerName, customerEmail, orderId, courierName, trackingNumber, trackingUrl } = params;

  const trackingSection = trackingUrl
    ? `<a href="${trackingUrl}" style="display: inline-block; margin-top: 12px; padding: 10px 20px; background: #111111; color: #ffffff; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; text-decoration: none;">Track Your Order →</a>`
    : `<p style="font-size: 12px; color: #404040; margin-top: 8px;">Reference: <strong>${trackingNumber}</strong>. You will receive delivery updates directly from ${courierName}.</p>`;

  const body = `
    <p style="font-size: 14px; color: #111111; margin-bottom: 8px;">Dear ${customerName},</p>
    <p style="font-size: 13px; color: #737373; line-height: 1.6; margin-bottom: 28px;">
      Your order has been carefully packaged and dispatched from our atelier. It is now in transit and on its way to you.
    </p>

    <div style="background-color: #fafafa; border: 1px solid #eeeeee; padding: 20px; margin-bottom: 28px;">
      <span style="font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #737373; display: block; margin-bottom: 12px;">Dispatch Details</span>
      <table style="width: 100%; font-size: 12px; color: #111111;">
        <tr>
          <td style="color: #737373; padding-bottom: 6px;">Order Ref:</td>
          <td style="font-family: monospace; text-align: right; padding-bottom: 6px;">${orderId.slice(0, 8)}</td>
        </tr>
        <tr>
          <td style="color: #737373; padding-bottom: 6px;">Courier:</td>
          <td style="text-align: right; padding-bottom: 6px; font-weight: 600;">${courierName}</td>
        </tr>
        <tr>
          <td style="color: #737373;">Waybill / Tracking:</td>
          <td style="text-align: right; font-family: monospace; font-weight: 600;">${trackingNumber}</td>
        </tr>
      </table>
      ${trackingSection}
    </div>

    <p style="font-size: 12px; color: #737373; line-height: 1.6;">
      Estimated delivery times vary by location. If you have any concerns, please reply to this email or reach us via our official channels.
    </p>
  `;

  try {
    await resend.emails.send({
      from: "TWOM <onboarding@resend.dev>",
      to: customerEmail,
      subject: `Your TWOM Order Is On Its Way — ${orderId.slice(0, 8)}`,
      html: wrapEmail(body),
    });
    console.log(`[Email] Dispatch notification sent to ${customerEmail}`);
  } catch (err) {
    console.error("[Email] Failed to send dispatch notification:", err);
  }
}

// ── Cancellation / Refund Notification ─────────────────────────────────────

interface CancellationEmailParams {
  customerName: string;
  customerEmail: string;
  orderId: string;
  totalAmount: number;
}

export async function sendCancellationNotification(params: CancellationEmailParams) {
  const resend = getResendClient();
  if (!resend) return;

  const { customerName, customerEmail, orderId, totalAmount } = params;

  const body = `
    <p style="font-size: 14px; color: #111111; margin-bottom: 8px;">Dear ${customerName},</p>
    <p style="font-size: 13px; color: #737373; line-height: 1.6; margin-bottom: 28px;">
      Your order has been cancelled as requested. A full refund of <strong>${formatNaira(totalAmount)}</strong> has been initiated via Paystack and will reflect in your account within 3–7 business days depending on your bank.
    </p>

    <div style="background-color: #fafafa; border: 1px solid #eeeeee; padding: 14px; margin-bottom: 28px;">
      <table style="width: 100%; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #737373;">
        <tr>
          <td>Order Reference:</td>
          <td style="text-align: right; font-family: monospace; color: #111111;">${orderId.slice(0, 8)}</td>
        </tr>
        <tr>
          <td style="padding-top: 6px;">Refund Amount:</td>
          <td style="padding-top: 6px; text-align: right; color: #111111; font-weight: 600;">${formatNaira(totalAmount)}</td>
        </tr>
        <tr>
          <td style="padding-top: 6px;">Refund Status:</td>
          <td style="padding-top: 6px; text-align: right; color: #0369a1; font-weight: 600;">Initiated</td>
        </tr>
      </table>
    </div>

    <p style="font-size: 12px; color: #737373; line-height: 1.6;">
      We hope to serve you again at TWOM Atelier.
    </p>
  `;

  try {
    await resend.emails.send({
      from: "TWOM <onboarding@resend.dev>",
      to: customerEmail,
      subject: `Order Cancelled & Refund Initiated — ${orderId.slice(0, 8)}`,
      html: wrapEmail(body),
    });
  } catch (err) {
    console.error("[Email] Failed to send cancellation notification:", err);
  }
}


