import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthService {
  // constructor(
  //   private usersService: UsersService,
  //   private jwtService: JwtService,
  // ) {}
  //
  // async login(dto: LoginDto) {
  //   const user = await this.usersService.findByEmail(dto.email);
  //   if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
  //     throw new UnauthorizedException('Invalid credentials');
  //   }
  //
  //   return this.generateTokens(user);
  // }
  //
  // async generateTokens(user: User) {
  //   const payload = { sub: user.id, email: user.email };
  //
  //   const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
  //   const refreshToken = this.jwtService.sign(payload, {
  //     expiresIn: '7d',
  //     secret: process.env.JWT_REFRESH_SECRET,
  //   });
  //
  //   // Store hashed refresh token in DB
  //   await this.usersService.saveRefreshToken(user.id, refreshToken);
  //
  //   return {
  //     accessToken,
  //     refreshToken,
  //     user: { id: user.id, email: user.email },
  //   };
  // }
}
