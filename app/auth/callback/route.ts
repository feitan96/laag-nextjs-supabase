// /app/auth/callback/route.ts
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { getUserRole } from '@/services/roles';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createClient();
    await (await supabase).auth.exchangeCodeForSession(code);

    // Check user role and redirect accordingly
    const role = await getUserRole(await supabase);
    
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url), {
        status: 302,
      });
    }
  }

  // Default redirect for users or if no role found
  return NextResponse.redirect(new URL('/user/feed', request.url), {
    status: 302,
  });
}