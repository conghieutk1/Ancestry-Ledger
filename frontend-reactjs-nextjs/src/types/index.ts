export enum Gender {
    MALE = 'MALE',
    FEMALE = 'FEMALE',
    OTHER = 'OTHER',
    UNKNOWN = 'UNKNOWN',
}

export enum Visibility {
    PUBLIC = 'PUBLIC',
    MEMBERS_ONLY = 'MEMBERS_ONLY',
    PRIVATE = 'PRIVATE',
}

export enum Role {
    ADMIN = 'ADMIN',
    COLLABORATOR = 'COLLABORATOR',
    MEMBER = 'MEMBER',
}

export interface FamilyBranch {
    id: string;

    description?: string;
    memberCount?: number;
    branchOrder?: number;
    isTrưởng?: boolean;
}

export interface Marriage {
    id: string;
    partner1: Member;
    partner2: Member;
    startDate?: string;
    endDate?: string;
    status: 'MARRIED' | 'DIVORCED' | 'SEPARATED' | 'WIDOWED';
    notes?: string;
}

export interface Member {
    id: string;
    firstName: string;
    lastName?: string;
    middleName?: string;
    fullName: string;
    gender: Gender;
    dateOfBirth?: string;
    dateOfDeath?: string;
    isAlive: boolean;
    bio?: string;
    notes?: string;
    avatarUrl?: string;
    placeOfBirth?: string;
    placeOfDeath?: string;
    occupation?: string;
    phoneNumber?: string;
    generationIndex?: number;
    visibility: Visibility;
    branch?: FamilyBranch;
    father?: Member;
    mother?: Member;
    children?: Member[];
    childrenCount?: number;
    marriagesAsPartner1?: Marriage[];
    marriagesAsPartner2?: Marriage[];
    spouse?: Member;
    marriageStatus?: 'MARRIED' | 'DIVORCED' | 'SEPARATED' | 'WIDOWED';
    generation?: string;
    branchDisplay?: string;
    birthYear?: number;
}

export interface User {
    id: string;
    email: string;
    displayName: string;
    role: Role;
}

export interface LoginResponse {
    access_token: string;
    refresh_token: string;
    user: User;
}
