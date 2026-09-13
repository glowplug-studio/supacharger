"use server";

/** ==========
 *
 * Supacharger - Logout Route.
 *
 * ========== */

import { NextResponse } from "next/server";

import { logoutUser } from "@/lib/supabase/supacharger/supabase-auth";
import { getSafeNextPath } from "@/supacharger/auth/safe-next-path";
import { SC_CONFIG } from "@/supacharger/supacharger-config";

type LogoutRouteResult =
  | { success: true; redirectTo: string }
  | { success: false };

async function getLogoutResult(): Promise<LogoutRouteResult> {
  const logoutResult = await logoutUser();
  if (!logoutResult.success) {
    return { success: false };
  }

  const redirectTo = getSafeNextPath(
    SC_CONFIG.USER_REDIRECTS.UNAUTHED_USER.LOGOUT_REDIRECT_DESTINATON,
  );
  return redirectTo ? { success: true, redirectTo } : { success: false };
}

export async function GET(): Promise<NextResponse> {
  const logoutResult = await getLogoutResult();
  if (!logoutResult.success) {
    return NextResponse.json(logoutResult, { status: 500, headers: { "Cache-Control": "private, no-store" } });
  }

  return new NextResponse(null, {
    status: 303,
    headers: { Location: logoutResult.redirectTo, "Cache-Control": "private, no-store" },
  });
}

export async function POST(): Promise<NextResponse> {
  const logoutResult = await getLogoutResult();
  return NextResponse.json(logoutResult, {
    status: logoutResult.success ? 200 : 500,
    headers: { "Cache-Control": "private, no-store" },
  });
}
