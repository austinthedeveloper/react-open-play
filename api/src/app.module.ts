import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { MatchesModule } from "./matches/matches.module";

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGO_URI ?? "mongodb://localhost:27017/pickle-goals"
    ),
    AuthModule,
    MatchesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
