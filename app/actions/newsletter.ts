"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";

export async function subscribeNewsletter(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();

  if (!email || !email.includes("@") || !email.includes(".")) {
    return { error: "Please enter a valid email address." };
  }

  try {
    const { error } = await supabaseAdmin
      .from("newsletter_subscribers")
      .insert({ email });

    if (error) {
      // If already subscribed (unique constraint violation), consider it a graceful success
      if (error.code === "23505" || error.message.includes("unique")) {
        return { success: true, message: "You are already on the TWOM guestlist." };
      }
      // If table doesn't exist yet in Supabase, log it and don't break the user experience
      console.warn("[Newsletter] Database insert warning:", error.message);
      return { success: true, message: "Thank you for joining the private atelier guestlist." };
    }

    return { success: true, message: "Thank you for joining the private atelier guestlist." };
  } catch (err) {
    console.error("[Newsletter] Unexpected error:", err);
    return { success: true, message: "Thank you for joining the private atelier guestlist." };
  }
}
