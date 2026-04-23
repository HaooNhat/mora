import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { MailModule } from 'src/services/mail/mail.module';
import { OidcModule } from 'src/services/oidc/oidc.module';
import { PrismaModule } from 'src/services/prisma/prisma.module';
import { UserModule } from 'src/services/user/user.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

import jwtConfig from './configs/jwt.config';

import { RefreshTokenRepository } from './repositories/refresh-token.repository';

import { AuthCookieService } from './services/auth-cookie.service';
import { EmailVerificationService } from './services/email-verification.service';
import { JwtTokenService } from './services/jwt-token.service';
import { RefreshTokenRotationService } from './services/refresh-token-rotation.service';
import { TokenCleanupService } from './services/token-cleanup.service';

import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PrismaModule,
    OidcModule,
    UserModule,
    MailModule,

    ConfigModule.forFeature(jwtConfig),

    JwtModule.registerAsync({
      imports: [ConfigModule.forFeature(jwtConfig)],
      inject: [jwtConfig.KEY],
      useFactory: (cfg: ConfigType<typeof jwtConfig>) => ({
        secret: cfg.JwtSecret,
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  providers: [
    // Repositories
    RefreshTokenRepository,
    // Services
    AuthCookieService,
    JwtTokenService,
    RefreshTokenRotationService,
    EmailVerificationService,
    AuthService,
    JwtStrategy,
    TokenCleanupService, // handles refresh token cleanup in Postgres
  ],
  controllers: [AuthController],
})
export class AuthModule {}
