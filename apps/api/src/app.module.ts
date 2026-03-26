import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { OidcModule } from './oidc/oidc.module';

@Module({
  imports: [
    // Global configurations
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Database
    PrismaModule,

    // Feature modules
    UserModule,
    AuthModule,
    OidcModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
