import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import * as path from "node:path";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { GoalsModule } from "./goals/goals.module";
import { GoalSessionsModule } from "./goal-sessions/goal-sessions.module";
import { MatchesModule } from "./matches/matches.module";
import { PlayersModule } from "./players/players.module";
import { GroupsModule } from "./groups/groups.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === "production"
          ? []
          : [
              path.resolve(process.cwd(), "..", ".env.local"),
              path.resolve(process.cwd(), "..", ".env.dev"),
              path.resolve(process.cwd(), "..", ".env"),
              path.resolve(process.cwd(), ".env.local"),
              path.resolve(process.cwd(), ".env"),
            ],
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri:
          configService.get<string>("MONGO_URI") ??
          "mongodb://localhost:27017/pickle-goals",
      }),
    }),
    AuthModule,
    GoalsModule,
    GoalSessionsModule,
    MatchesModule,
    PlayersModule,
    GroupsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
