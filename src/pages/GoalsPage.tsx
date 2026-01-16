import { goalsActions } from "../store/goalsSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import GoalsControls from "../components/goals/GoalsControls";
import GoalsHero from "../components/goals/GoalsHero";
import GoalsList from "../components/goals/GoalsList";

export default function GoalsPage() {
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state) => state.goals.profile);
  const numMatches = useAppSelector((state) => state.goals.numMatches);
  const matches = useAppSelector((state) => state.goals.matches);

  const completedCount = matches.filter((m) => m.result === "yes").length;
  const playedCount = matches.filter((m) => m.played).length;

  const regenerate = () => {
    dispatch(goalsActions.regenerateMatches());
  };

  return (
    <div className="app-shell text-left">
      <GoalsHero
        profile={profile}
        playedCount={playedCount}
        completedCount={completedCount}
        totalMatches={matches.length}
      />

      <GoalsControls
        numMatches={numMatches}
        defaultOpponentLevel={profile.defaultOpponentLevel}
        onChangeNumMatches={(value) =>
          dispatch(goalsActions.setNumMatches(value))
        }
        onChangeOpponentLevel={(level) =>
          dispatch(goalsActions.setDefaultOpponentLevel(level))
        }
        onGenerate={regenerate}
      />

      <GoalsList />
    </div>
  );
}
