import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsEmail, IsIn, IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength } from 'class-validator';
import { PASSWORD_PATTERN, PASSWORD_REQUIREMENTS_MESSAGE } from '../../common/password-policy';
import { USER_TYPES, type UserType } from '../../common/user-type';

export class CreateUserDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_REQUIREMENTS_MESSAGE })
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  mobile?: string;

  @IsOptional()
  @IsIn(USER_TYPES)
  userType?: UserType;

  @IsArray()
  @ArrayMinSize(1)
  @Type(() => String)
  @IsUUID('4', { each: true })
  roleIds!: string[];
}
