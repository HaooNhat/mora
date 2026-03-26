import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'src/prisma/prisma.module';
import userConfig from './configs/user.config';
import { UserService } from './user.service';

@Module({
  imports: [PrismaModule, ConfigModule.forFeature(userConfig)],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
