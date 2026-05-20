import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'PasswordMatch', async: false })
class PasswordMatchConstraint implements ValidatorConstraintInterface {
  validate(confirmPassword: string, args: ValidationArguments) {
    const obj = args.object as RegisterDto;
    return obj.password === confirmPassword;
  }

  defaultMessage() {
    return 'Passwords do not match';
  }
}

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({ example: 'SecurePass1!', minLength: 8, maxLength: 20 })
  @IsString()
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'Password must be at least 8 characters and include uppercase, lowercase, number, and symbol',
    },
  )
  @MaxLength(20, { message: 'Password must be at most 20 characters' })
  password: string;

  @ApiProperty({ example: 'SecurePass1!' })
  @IsString()
  @Validate(PasswordMatchConstraint)
  confirmPassword: string;

  @ApiProperty({ example: 'John', minLength: 1, maxLength: 50 })
  @IsString()
  @MinLength(1, { message: 'First name is required' })
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Doe', minLength: 1, maxLength: 50 })
  @IsString()
  @MinLength(1, { message: 'Last name is required' })
  @MaxLength(50)
  lastName: string;
}
