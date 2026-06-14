import Header from '@/components/Header';
import BetLog from '@/components/BetLog';
import DailyTips from '@/components/DailyTips';
import { FlaskConical } from 'lucide-react';

export default function BetsPage() {
  return (
    <main className="max-w-6xl mx-auto p-4 md:p-6 relative z-10">
      <Header />
      <section>
        <h2 className="display-title text-xl mb-3 flex items-center gap-2">
          <FlaskConical size={20} strokeWidth={2} style={{ color: 'var(--gold-bright)' }} fill="rgba(232,200,106,0.25)" />
          Team Bets
        </h2>
        <p className="text-sm text-text-muted mb-4">
          Every bet logged by the team, in one place. The conflict detector flags when two of you are on opposite sides of the same market.
        </p>
        <div className="mb-4">
          <DailyTips />
        </div>
        <BetLog />
      </section>
    </main>
  );
}
