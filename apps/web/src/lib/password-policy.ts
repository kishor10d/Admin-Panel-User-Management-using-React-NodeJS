import { z } from 'zod';

export const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{8,128}$/;
export const PASSWORD_REQUIREMENTS_MESSAGE = 'Use at least 8 characters with a letter, number, and special character.';

export const passwordSchema = z.string().regex(PASSWORD_PATTERN, PASSWORD_REQUIREMENTS_MESSAGE);

export function isValidPassword(password: string) {
  return PASSWORD_PATTERN.test(password);
}
