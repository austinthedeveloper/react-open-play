export type MatchBuilderHeroProps = {
  matchTypeLabel: string;
};

export default function MatchBuilderHero({
  matchTypeLabel,
}: MatchBuilderHeroProps) {
  return (
    <header className="hero-panel">
      <div>
        <p className="eyebrow">{matchTypeLabel} Lab</p>
        <h1 className="hero-title">Match Builder</h1>
        <p className="hero-subtitle">
          Build a doubles schedule that keeps play time balanced and mixes
          teammates and opponents across the group.
        </p>
      </div>
    </header>
  );
}
