"use server";

/** ==========
 *
 * Supacharger - Logout Route.
 *
 * ========== */

import { NextResponse } from "next/server";

import { logoutUser } from "@/lib/supabase/supacharger/supabase-auth";
import { SC_CONFIG } from "@/supacharger/supacharger-config";
import { getURL } from "@/supacharger/utils/helpers";

export async function GET(): Promise<NextResponse> {
  const logoutResult = await logoutUser();
  if (!logoutResult.success) {
    return NextResponse.json(logoutResult, { status: 500 });
  }
  const redirectURL = getURL(SC_CONFIG.USER_REDIRECTS.UNAUTHED_USER.LOGOUT_REDIRECT_DESTINATON);
  return NextResponse.redirect(redirectURL);
}

export async function POST() {
  return await GET(); // Reuse the GET logic
}
