import { NextResponse } from 'next/server';
import { getFixtures } from '@/lib/api-football';

export const revalidate = 0;

export async function GET() {
  try {
    const data = await getFixtures();
    return NextResponse.json({ fixtures: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Fetch failed' }, { status: 500 });
  }
}
