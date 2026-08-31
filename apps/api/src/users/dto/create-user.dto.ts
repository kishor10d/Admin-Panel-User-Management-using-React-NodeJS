import { Transform, Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { PASSWORD_PATTERN, PASSWORD_REQUIREMENTS_MESSAGE } from '../../common/password-policy';
import { USER_TYPES, type UserType } from '../../common/user-type';

export class CreateUserDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_REQUIREMENTS_MESSAGE })
  password!: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @IsNotEmpty({ message: 'Name cannot be blank.' })
  @MinLength(2)
  @MaxLength(128)
  name!: string;

  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @ValidateIf((_, value) => value !== '')
  @IsString()
  @Matches(/^\d{1,15}$/, { message: 'Mobile must contain only digits and be 15 digits or fewer.' })
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
