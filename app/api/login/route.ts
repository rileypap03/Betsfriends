import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    const expected = process.env.TEAM_PASSWORD;
    if (!expected) {
      return NextResponse.json({ error: 'Server misconfigured: TEAM_PASSWORD not set' }, { status: 500 });
    }
    if (password !== expected) {
      return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set('wc26_auth', '1', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 60, // 60 days
    });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Login failed' }, { status: 500 });
  }
}
