import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@cba.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Admin@2026' })
  @IsString()
  @MinLength(6)
  password: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'admin@cba.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Admin@2026' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ example: 'Doe' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: 'IT' })
  @IsOptional()
  @IsString()
  department?: string;
}

export class AuthResponseDto {
  @ApiProperty()
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
    department?: string;
  };

  @ApiProperty()
  accessToken: string;
}
