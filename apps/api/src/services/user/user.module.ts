import { PrismaModule } from '@mora/api/services/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

@Module({
  imports: [PrismaModule],
  providers: [UserRepository, UserService],
  exports: [UserRepository, UserService],
})
export class UserModule {}
