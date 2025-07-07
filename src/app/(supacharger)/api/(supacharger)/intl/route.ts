import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
    const cookieStore = cookies();
    const currentLocale = (await cookieStore).get('supacharger_locale')?.value || 'en';
    return NextResponse.json({ locale: currentLocale });
}
