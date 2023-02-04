import { UserType } from '@app/types/user.type';

export type ProfileType = UserType & { following: boolean };

/* UserType & { following: boolean}; - так мы явно указали что у нас ProfileType будет типа UserType + одно новое свойство following
 */
