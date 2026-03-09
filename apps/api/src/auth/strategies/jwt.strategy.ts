// import { Injectable } from '@nestjs/common';
// import { PassportStrategy } from '@nestjs/passport';
// import { ExtractJwt, Strategy } from 'passport-jwt';
//
// @Injectable()
// export class JwtStrategy extends PassportStrategy(Strategy) {
//   constructor() {
//     super({
//       jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
//       secretOrKey: process.env.JWT_SECRET || 'bottom_secret',
//     });
//   }
//
//   async validate(payload: JwtPayload) {
//     // This becomes req.user
//     return { id: payload.sub, email: payload.email };
//   }
// }
