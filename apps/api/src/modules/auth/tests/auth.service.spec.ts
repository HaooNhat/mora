import { UserService } from '@mora/api/services/user/user.service';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@prisma/client';
import { AuthService } from '../auth.service';
import { EmailVerificationService } from '../services/email-verification.service';
import { JwtTokenService } from '../services/jwt-token.service';
import { RefreshTokenRotationService } from '../services/refresh-token-rotation.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'user@example.com',
    passwordHash: 'hashed',
    firstName: 'John',
    lastName: 'Doe',
    picture: null,
    googleId: null,
    isEmailVerified: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: null,
    ...overrides,
  };
}

const MOCK_TOKENS = { accessToken: 'at-token', refreshToken: 'rt-token' };

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockUserService = {
  getUserByEmail: jest.fn(),
  getUserById: jest.fn(),
  createUser: jest.fn(),
  verifyPassword: jest.fn(),
} as unknown as jest.Mocked<UserService>;

const mockJwtTokenService = {
  signTokens: jest.fn().mockReturnValue(MOCK_TOKENS),
  denyAccessToken: jest.fn(),
} as unknown as jest.Mocked<JwtTokenService>;

const mockRefreshRotation = {
  persistRefreshToken: jest.fn(),
  rotateRefreshToken: jest.fn(),
  revokeRefreshToken: jest.fn(),
  revokeAllDevices: jest.fn(),
} as unknown as jest.Mocked<RefreshTokenRotationService>;

const mockEmailVerification = {
  createAndSendVerificationToken: jest.fn(),
  verifyToken: jest.fn(),
} as unknown as jest.Mocked<EmailVerificationService>;

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtTokenService, useValue: mockJwtTokenService },
        { provide: RefreshTokenRotationService, useValue: mockRefreshRotation },
        { provide: EmailVerificationService, useValue: mockEmailVerification },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  // ── register ──────────────────────────────────────────────────────────────

  describe('register', () => {
    const dto = {
      email: 'new@example.com',
      password: 'Password1!',
      confirmPassword: 'Password1!',
      firstName: 'Jane',
      lastName: 'Doe',
    };

    it('creates a user and sends verification email', async () => {
      mockUserService.getUserByEmail!.mockResolvedValue(null);
      mockUserService.createUser!.mockResolvedValue(
        makeUser({ id: 'user-new', email: dto.email }),
      );

      await service.register(dto);

      expect(mockUserService.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ email: dto.email }),
      );
      expect(
        mockEmailVerification.createAndSendVerificationToken,
      ).toHaveBeenCalledWith('user-new', dto.email);
    });

    it('throws ConflictException if email already verified', async () => {
      mockUserService.getUserByEmail!.mockResolvedValue(
        makeUser({ email: dto.email }),
      );

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
      expect(mockUserService.createUser).not.toHaveBeenCalled();
    });

    it('throws ConflictException if linked to Google account', async () => {
      mockUserService.getUserByEmail!.mockResolvedValue(
        makeUser({ googleId: 'google-123', isEmailVerified: false }),
      );

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });

    it('resends verification email and throws if email exists but unverified', async () => {
      const unverified = makeUser({
        email: dto.email,
        isEmailVerified: false,
        googleId: null,
      });
      mockUserService.getUserByEmail!.mockResolvedValue(unverified);

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
      expect(
        mockEmailVerification.createAndSendVerificationToken,
      ).toHaveBeenCalled();
    });

    it('throws UnauthorizedException if account is disabled', async () => {
      mockUserService.getUserByEmail!.mockResolvedValue(
        makeUser({ isActive: false }),
      );

      await expect(service.register(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('normalises email to lowercase before lookup', async () => {
      mockUserService.getUserByEmail!.mockResolvedValue(null);
      mockUserService.createUser!.mockResolvedValue(
        makeUser({ email: 'new@example.com' }),
      );

      await service.register({ ...dto, email: 'NEW@EXAMPLE.COM' });

      expect(mockUserService.getUserByEmail).toHaveBeenCalledWith(
        'new@example.com',
      );
    });
  });

  // ── verifyEmail ───────────────────────────────────────────────────────────

  describe('verifyEmail', () => {
    it('resolves when token is valid', async () => {
      mockEmailVerification.verifyToken!.mockResolvedValue('user-1');
      await expect(service.verifyEmail('valid-token')).resolves.toBeUndefined();
    });

    it('throws UnauthorizedException when token is invalid', async () => {
      mockEmailVerification.verifyToken!.mockResolvedValue(null);
      await expect(service.verifyEmail('bad-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ── loginWithPassword ─────────────────────────────────────────────────────

  describe('loginWithPassword', () => {
    const dto = { email: 'user@example.com', password: 'Password1!' };

    it('returns tokens on valid credentials', async () => {
      mockUserService.getUserByEmail!.mockResolvedValue(makeUser());
      mockUserService.verifyPassword!.mockResolvedValue(true);

      const result = await service.loginWithPassword(dto);

      expect(result).toEqual(MOCK_TOKENS);
      expect(mockRefreshRotation.persistRefreshToken).toHaveBeenCalled();
    });

    it('throws UnauthorizedException on wrong password', async () => {
      mockUserService.getUserByEmail!.mockResolvedValue(makeUser());
      mockUserService.verifyPassword!.mockResolvedValue(false);

      await expect(service.loginWithPassword(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when user not found', async () => {
      mockUserService.getUserByEmail!.mockResolvedValue(null);

      await expect(service.loginWithPassword(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when email not verified', async () => {
      mockUserService.getUserByEmail!.mockResolvedValue(
        makeUser({ isEmailVerified: false }),
      );
      mockUserService.verifyPassword!.mockResolvedValue(true);

      await expect(service.loginWithPassword(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when account disabled', async () => {
      mockUserService.getUserByEmail!.mockResolvedValue(
        makeUser({ isActive: false }),
      );
      mockUserService.verifyPassword!.mockResolvedValue(true);

      await expect(service.loginWithPassword(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ── getUserProfile ────────────────────────────────────────────────────────

  describe('getUserProfile', () => {
    it('returns user when found', async () => {
      const user = makeUser();
      mockUserService.getUserById!.mockResolvedValue(user);

      const result = await service.getUserProfile('user-1');
      expect(result).toEqual(user);
    });

    it('throws NotFoundException when user does not exist', async () => {
      mockUserService.getUserById!.mockResolvedValue(null);

      await expect(service.getUserProfile('ghost')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── refreshTokens ─────────────────────────────────────────────────────────

  describe('refreshTokens', () => {
    it('delegates to RefreshTokenRotationService', async () => {
      mockRefreshRotation.rotateRefreshToken!.mockResolvedValue(MOCK_TOKENS);

      const result = await service.refreshTokens('rt-token');
      expect(result).toEqual(MOCK_TOKENS);
      expect(mockRefreshRotation.rotateRefreshToken).toHaveBeenCalledWith(
        'rt-token',
      );
    });
  });

  // ── loginWithGoogle ───────────────────────────────────────────────────────

  describe('loginWithGoogle', () => {
    const googleInput = {
      googleId: 'google-sub',
      email: 'google@example.com',
      emailVerified: true,
      firstName: 'Jane',
      lastName: 'Doe',
      picture: 'https://example.com/pic.jpg',
    };

    it('creates a new user on first Google login', async () => {
      mockUserService.getUserByEmail!.mockResolvedValue(null);
      mockUserService.createUser!.mockResolvedValue(
        makeUser({ email: googleInput.email, googleId: googleInput.googleId }),
      );

      const result = await service.loginWithGoogle(googleInput);
      expect(result).toEqual(MOCK_TOKENS);
      expect(mockUserService.createUser).toHaveBeenCalled();
    });

    it('issues tokens for existing Google user', async () => {
      mockUserService.getUserByEmail!.mockResolvedValue(
        makeUser({ googleId: googleInput.googleId }),
      );

      const result = await service.loginWithGoogle(googleInput);
      expect(result).toEqual(MOCK_TOKENS);
      expect(mockUserService.createUser).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when email is unverified by Google', async () => {
      await expect(
        service.loginWithGoogle({ ...googleInput, emailVerified: false }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when email belongs to a password account', async () => {
      mockUserService.getUserByEmail!.mockResolvedValue(
        makeUser({ googleId: null }),
      );

      await expect(service.loginWithGoogle(googleInput)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when account is disabled', async () => {
      mockUserService.getUserByEmail!.mockResolvedValue(
        makeUser({ googleId: googleInput.googleId, isActive: false }),
      );

      await expect(service.loginWithGoogle(googleInput)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ── logout ────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('revokes refresh token and denies access token', async () => {
      await service.logout('rt-token', 'at-token');

      expect(mockRefreshRotation.revokeRefreshToken).toHaveBeenCalledWith(
        'rt-token',
      );
      expect(mockJwtTokenService.denyAccessToken).toHaveBeenCalledWith(
        'at-token',
      );
    });

    it('only revokes refresh token when no access token provided', async () => {
      await service.logout('rt-token');

      expect(mockRefreshRotation.revokeRefreshToken).toHaveBeenCalledWith(
        'rt-token',
      );
      expect(mockJwtTokenService.denyAccessToken).not.toHaveBeenCalled();
    });
  });
});
