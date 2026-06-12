import Header from '@/components/Header';
import BetLog from '@/components/BetLog';

export default function BetsPage() {
  return (
    <main className="max-w-6xl mx-auto p-4 md:p-6 relative z-10">
      <Header />
      <section>
        <h2 className="display-title text-xl mb-3 flex items-center gap-3">
          <span className="w-1 h-5 bg-gold inline-block" />
          Bet Lab · Team Strategy
        </h2>
        <p className="text-sm text-text-muted mb-4">
          Log every bet here. The conflict detector flags when two of you are on opposite sides of the same market — that's pure margin loss to the bookmaker.
        </p>
        <BetLog />
      </section>
    </main>
  );
}
