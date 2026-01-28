import mongoose from "mongoose";
import { createHash } from "node:crypto";
import { Goal, GoalSchema } from "../src/goals/schemas/goal.schema";

type SeedGoal = {
  goalText: string;
  opponentLevel?: "lower" | "same" | "higher" | null;
};

const seedGoals: SeedGoal[] = [
  { goalText: "Hit at least 3 dinks per rally before attacking." },
  { goalText: "Serve only to backhands." },
  { goalText: "Every return must land deep (past midcourt)." },
  { goalText: "No backspin allowed this match.", opponentLevel: "same" },
  {
    goalText: "Practice soft hands: reset hard balls back to the kitchen.",
    opponentLevel: "lower",
  },
  { goalText: "No hero shots down the line.", opponentLevel: "higher" },
];

const createGoalId = (goalText: string) => {
  const hash = createHash("sha1").update(goalText).digest("hex");
  return `global_${hash}`;
};

const getMongoUri = () =>
  process.env.MONGO_URI ?? "mongodb://localhost:27017/pickle-goals";

const main = async () => {
  const uri = getMongoUri();
  await mongoose.connect(uri);

  const GoalModel = mongoose.model(Goal.name, GoalSchema);
  const now = Date.now();

  for (const goal of seedGoals) {
    const goalId = createGoalId(goal.goalText);
    await GoalModel.findOneAndUpdate(
      { goalId },
      {
        goalId,
        type: "global",
        goalText: goal.goalText,
        opponentLevel: goal.opponentLevel ?? null,
        createdAt: now,
        updatedAt: now,
        createdById: "system",
        createdByName: "Seed Script",
        createdByPhotoUrl: null,
        updatedById: "system",
        updatedByName: "Seed Script",
        updatedByPhotoUrl: null,
      },
      { upsert: true, new: true },
    ).exec();
  }

  await mongoose.disconnect();
  console.log(`Seeded ${seedGoals.length} global goals.`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
