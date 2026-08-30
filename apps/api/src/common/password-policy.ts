export const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{8,128}$/;
export const PASSWORD_REQUIREMENTS_MESSAGE = 'Password must be at least 8 characters and include a letter, number, and special character.';

export function isValidPassword(password: string) {
  return PASSWORD_PATTERN.test(password);
}
