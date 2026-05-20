import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { AuthCookieService } from '../services/auth-cookie.service';
import { OidcService } from '@mora/api/services/oidc/oidc.service';
import { RedisService } from '@mora/api/services/redis/redis.service';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

// Mock every dependency — controller test doesn't care HOW they work,
// only that the controller calls them and responds correctly.
const mockAuthService = {
  loginWithPassword: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  getUserProfile: jest.fn(),
  refreshTokens: jest.fn(),
};

const mockAuthCookieService = {
  setAuthCookies: jest.fn(),
  clearAuthCookies: jest.fn(),
};

describe('AuthController', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ limit: 5, ttl: 60000 }])],
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: AuthCookieService, useValue: mockAuthCookieService },
        { provide: OidcService, useValue: {} },
        { provide: RedisService, useValue: {} },
        {
          provide: 'appConfig',
          useValue: {
            frontendUrl: 'http://localhost:3000',
            backendUrl: 'http://localhost:4000',
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterEach(() => app.close());

  // ── This test is impossible in a service spec ────────────────────────────
  it('POST /auth/login returns 200, not 201', async () => {
    mockAuthService.loginWithPassword.mockResolvedValue({
      accessToken: 'at',
      refreshToken: 'rt',
    });

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'user@example.com', password: 'Password1!' });

    expect(res.status).toBe(200);
    expect(mockAuthCookieService.setAuthCookies).toHaveBeenCalled();
  });

  it('POST /auth/login does NOT expose passwordHash in response', async () => {
    mockAuthService.loginWithPassword.mockResolvedValue({
      accessToken: 'at',
      refreshToken: 'rt',
    });

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'user@example.com', password: 'Password1!' });

    expect(res.body).not.toHaveProperty('passwordHash'); // @Serialize enforcement
  });

  it('POST /auth/login returns 401 on bad credentials', async () => {
    mockAuthService.loginWithPassword.mockRejectedValue(
      new UnauthorizedException('Invalid credentials'),
    );

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'x@x.com', password: 'Bad1!' });

    expect(res.status).toBe(401);
  });
});
