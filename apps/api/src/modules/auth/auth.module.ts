import { Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { MailModule } from '@mora/api/services/mail/mail.module';
import { OidcModule } from '@mora/api/services/oidc/oidc.module';
import { PrismaModule } from '@mora/api/services/prisma/prisma.module';
import { UserModule } from '@mora/api/services/user/user.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

import jwtConfig from '@mora/api/configs/jwt.config';

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

    JwtModule.registerAsync({
      inject: [jwtConfig.KEY],
      useFactory: (jwtConf: ConfigType<typeof jwtConfig>) => ({
        secret: jwtConf.jwtSecret,
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
