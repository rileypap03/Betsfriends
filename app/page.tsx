import Header from '@/components/Header';
import Leaderboard from '@/components/Leaderboard';
import BalanceChart from '@/components/BalanceChart';
import InstallPrompt from '@/components/InstallPrompt';
import { Trophy, LineChart as LineChartIcon } from 'lucide-react';

export default function DashboardPage() {
  return (
    <main className="max-w-6xl mx-auto p-4 md:p-6 relative z-10">
      <Header />
      <div className="space-y-6">
        <section>
          <h2 className="display-title text-xl mb-3 flex items-center gap-2">
            <LineChartIcon size={20} strokeWidth={2} style={{ color: 'var(--gold-bright)' }} fill="rgba(232,200,106,0.18)" />
            Profit &amp; Loss
          </h2>
          <BalanceChart />
        </section>
        <section>
          <h2 className="display-title text-xl mb-3 flex items-center gap-2">
            <Trophy size={20} strokeWidth={2} style={{ color: 'var(--gold-bright)' }} fill="rgba(232,200,106,0.25)" />
            Group Stage Standings
          </h2>
          <Leaderboard />
        </section>
      </div>
      <InstallPrompt />
    </main>
  );
}
