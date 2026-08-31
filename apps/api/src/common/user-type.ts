export const USER_TYPES = ['REGULAR', 'SYSTEM_ADMINISTRATOR', 'SERVICE'] as const;

export type UserType = (typeof USER_TYPES)[number];
