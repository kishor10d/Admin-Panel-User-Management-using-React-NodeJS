import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { PASSWORD_PATTERN, PASSWORD_REQUIREMENTS_MESSAGE } from '../../common/password-policy';

export class ResetPasswordDto {
  @IsString()
  @MinLength(32)
  @MaxLength(256)
  token!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_REQUIREMENTS_MESSAGE })
  password!: string;
}
