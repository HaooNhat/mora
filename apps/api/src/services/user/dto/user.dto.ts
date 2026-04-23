import { Optional } from '@nestjs/common';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  IsStrongPassword,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsBoolean()
  @Optional()
  email_verified: boolean;

  @IsOptional()
  @IsStrongPassword()
  password?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  lastName?: string;

  @IsOptional()
  @IsUrl()
  picture?: string;

  @IsOptional()
  @IsString()
  googleId?: string;
}
