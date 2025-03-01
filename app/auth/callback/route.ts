// /app/auth/callback/route.ts
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createClient();
    await (await supabase).auth.exchangeCodeForSession(code);
  }

  // Redirect to the dashboard after successful login
  return NextResponse.redirect(new URL('/account', request.url), {
    status: 302,
  })
}