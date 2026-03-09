import { Controller, Get, UseGuards } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { GoogleAuthGuard } from './guards/google.guard';

@Controller('auth')
export class AuthController {
  // @HttpCode(HttpStatus.OK)
  // @Post('login')
  // login() {
  //   throw new NotImplementedException('This method is not implemented');
  // }

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google/login')
  googleLogin() {}

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  googleCallback() {}
}
