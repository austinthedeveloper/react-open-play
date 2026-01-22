import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { MatchesModule } from "./matches/matches.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri:
          configService.get<string>("MONGO_URI") ??
          "mongodb://localhost:27017/pickle-goals",
      }),
    }),
    AuthModule,
    MatchesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
