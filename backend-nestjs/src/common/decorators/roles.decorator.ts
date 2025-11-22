import { SetMetadata } from '@nestjs/common';

export enum Role {
  GUEST = 'GUEST',
  MEMBER = 'MEMBER',
  COLLABORATOR = 'COLLABORATOR',
  ADMIN = 'ADMIN',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
