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
      body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 500, messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
        { type: 'text', text: 'This is a betting slip screenshot. Return ONLY valid JSON (no markdown, no preamble): {"event":"match name","selection":"what was bet on","stake":10.00,"odds":2.50,"bet_type":"single|acca|bet_builder","legs":["leg1","leg2"],"status":"open|won|lost|cashout","returns":null}. For accas set event to "Accumulator", odds to total odds, legs to each selection. For status: if the slip shows a win, payout, or settled as winner set "won"; if it shows a loss or loser set "lost"; if it shows "Cash Out" or a partial payout set "cashout"; otherwise set "open". For returns: if the slip shows a payout or cash out amount, set that number, otherwise null. Use null for any other field not visible in the image.' }
      ]}] })
    });
    if (!res.ok) {
      const errBody = await res.text();
      return NextResponse.json({ error: `Claude API error (${res.status}): ${errBody.slice(0, 300)}` }, { status: 500 });
    }
    const data = await res.json();
    const text = data.content?.find((c: any) => c.type === 'text')?.text || data.content?.[0]?.text || '';
    if (!text) {
      return NextResponse.json({ error: `No text in Claude response: ${JSON.stringify(data).slice(0, 300)}` }, { status: 500 });
    }
    // Strip markdown fences and find the JSON object even if there's surrounding text
    let cleaned = text.replace(/```json|```/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleaned = jsonMatch[0];
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: `Could not parse JSON from response: ${cleaned.slice(0, 300)}` }, { status: 500 });
    }
    return NextResponse.json({ bet: parsed });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
