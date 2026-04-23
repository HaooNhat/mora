import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

export class UserResponseDto {
  @ApiProperty({ example: 'clx1234abcd' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  @Expose()
  email: string;

  @ApiProperty({ example: 'John', nullable: true })
  @Expose()
  firstName: string | null;

  @ApiProperty({ example: 'Doe', nullable: true })
  @Expose()
  lastName: string | null;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', nullable: true })
  @Expose()
  picture: string | null;

  @Exclude()
  googleId: string | null;
  @Exclude()
  passwordHash: string | null;
  @Exclude()
  createdAt: Date;
  @Exclude()
  updatedAt: Date;
  @Exclude()
  lastLoginAt: Date | null;
  @Exclude()
  isEmailVerified: boolean;
  @Exclude()
  isActive: boolean;
}
