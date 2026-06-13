import { NextResponse } from 'next/server';
export const revalidate = 0;
export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    if (!image) return NextResponse.json({ error: 'No image' }, { status: 400 });
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 });
    const base64 = image.split(',')[1];
    const mediaType = image.split(';')[0].split(':')[1] || 'image/jpeg';
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 500, messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
        { type: 'text', text: 'This is a betting app screenshot. Return ONLY valid JSON: {"event":"match name","selection":"what was bet on","stake":10.00,"odds":2.50,"bet_type":"single|acca|bet_builder","legs":["leg1","leg2"]}. For accas set event to Accumulator, odds to total odds, legs to each selection. Use null if not visible.' }
      ]}] })
    });
    if (!res.ok) return NextResponse.json({ error: 'Claude API error' }, { status: 500 });
    const data = await res.json();
    const text = data.content?.[0]?.text || '';
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    return NextResponse.json({ bet: parsed });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
