import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { OidcModule } from 'src/oidc/oidc.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UserModule } from 'src/user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import googleOauthConfig from './configs/google-oauth.config';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import jwtConfig from './configs/jwt.config';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    OidcModule,

    JwtModule.register({
      secret: process.env.JWT_SECRET!,
      signOptions: { expiresIn: '15m' },
    }),

    ConfigModule.forFeature(googleOauthConfig),
    ConfigModule.forFeature(jwtConfig),
  ],
  providers: [AuthService, GoogleStrategy, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
