import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { GoalSessionsController } from "./goal-sessions.controller";
import { GoalSessionsService } from "./goal-sessions.service";
import { GoalSession, GoalSessionSchema } from "./schemas/goal-session.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GoalSession.name, schema: GoalSessionSchema },
    ]),
  ],
  controllers: [GoalSessionsController],
  providers: [GoalSessionsService],
})
export class GoalSessionsModule {}
