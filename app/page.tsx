import Header from '@/components/Header';
import Leaderboard from '@/components/Leaderboard';
import InstallPrompt from '@/components/InstallPrompt';

export default function DashboardPage() {
  return (
    <main className="max-w-6xl mx-auto p-4 md:p-6 relative z-10">
      <Header />
      <div className="space-y-6">
        <section>
          <h2 className="display-title text-xl mb-3 flex items-center gap-3">
            <span className="w-1 h-5 bg-gold inline-block" />
            Group Stage Standings
          </h2>
          <Leaderboard />
        </section>
      </div>
      <InstallPrompt />
    </main>
  );
}
