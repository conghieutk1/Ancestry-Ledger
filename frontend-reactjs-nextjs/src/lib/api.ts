import axios from 'axios';
import { Member, FamilyBranch, User, LoginResponse } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
    (config) => {
        const token =
            typeof window !== 'undefined'
                ? localStorage.getItem('token')
                : null;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle 401 errors (expired token)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid - logout user
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                // Redirect to login page
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// Logout function
export const logout = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    }
};

// Get current user from localStorage
export const getCurrentUser = (): User | null => {
    if (typeof window !== 'undefined') {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch {
                return null;
            }
        }
    }
    return null;
};

// Auth
export const login = async (credentials: any) => {
    try {
        const response = await api.post<LoginResponse>(
            '/auth/login',
            credentials
        );
        if (response.data.access_token) {
            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    } catch (error: any) {
        console.error('Login error details:', error.response?.data);
        throw error;
    }
};
// Members
export const getMembers = async (params?: {
    page?: number;
    take?: number;
    q?: string;
    branchId?: string;
    gender?: string;
    isAlive?: boolean;
}) => {
    const response = await api.get<{ data: Member[]; meta: any }>('/members', {
        params,
    });
    return response.data;
};

export const getMember = async (id: string) => {
    const response = await api.get<Member>(`/members/${id}`);
    return response.data;
};

export const getMemberChildren = async (id: string): Promise<Member[]> => {
    try {
        // Fetch all members and filter by father/mother
        // Since children relation was removed from backend, we query manually
        let allChildren: Member[] = [];
        let page = 1;
        const pageSize = 100;
        let hasMore = true;

        while (hasMore) {
            const response = await api.get<{ data: Member[]; meta: any }>(
                '/members',
                {
                    params: {
                        page,
                        take: pageSize,
                    },
                }
            );

            const members = response.data.data;
            const childrenInPage = members.filter(
                (m) => m.father?.id === id || m.mother?.id === id
            );
            allChildren = [...allChildren, ...childrenInPage];

            const meta = response.data.meta;
            hasMore = page < (meta?.pageCount || 1);
            page++;

            // Safety limit
            if (page > 100) break;
        }

        return allChildren;
    } catch (error) {
        console.error('Error fetching children:', error);
        return [];
    }
};
export const createMember = async (data: Partial<Member>) => {
    const response = await api.post<Member>('/members', data);
    return response.data;
};

export const updateMember = async (id: string, data: Partial<Member>) => {
    const response = await api.patch<Member>(`/members/${id}`, data);
    return response.data;
};

export const deleteMember = async (id: string) => {
    const response = await api.delete(`/members/${id}`);
    return response.data;
};

// Branches
export const getBranches = async () => {
    const response = await api.get<FamilyBranch[]>('/family-branches');
    return response.data;
};

export const getBranch = async (id: string) => {
    const response = await api.get<FamilyBranch>(`/family-branches/${id}`);
    return response.data;
};

export const createBranch = async (data: Partial<FamilyBranch>) => {
    const response = await api.post<FamilyBranch>('/family-branches', data);
    return response.data;
};

export const updateBranch = async (id: string, data: Partial<FamilyBranch>) => {
    const response = await api.patch<FamilyBranch>(
        `/family-branches/${id}`,
        data
    );
    return response.data;
};

export const deleteBranch = async (id: string) => {
    const response = await api.delete(`/family-branches/${id}`);
    return response.data;
};

// Users
export const getUsers = async () => {
    const response = await api.get<User[]>('/users');
    return response.data;
};

export const getUser = async (id: string) => {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
};

export const createUser = async (
    data: Partial<User> & { password: string }
) => {
    const response = await api.post<User>('/auth/register', data);
    return response.data;
};

export const updateUser = async (id: string, data: Partial<User>) => {
    const response = await api.patch<User>(`/users/${id}`, data);
    return response.data;
};

export const deleteUser = async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
};

// Stats
export const getStats = async () => {
    try {
        const [members, branches, users] = await Promise.all([
            getMembers(),
            getBranches(),
            getUsers(),
        ]);

        return {
            totalMembers: members.meta.itemCount, // Use total count from pagination metadata
            totalBranches: branches.length,
            totalUsers: users.length,
        };
    } catch (error) {
        console.error('Error fetching stats', error);
        return {
            totalMembers: 0,
            totalBranches: 0,
            totalUsers: 0,
        };
    }
};
// Marriages
export const getMarriages = async () => {
    const response = await api.get<any[]>('/marriages');
    return response.data;
};

export const createMarriage = async (data: any) => {
    const response = await api.post<any>('/marriages', data);
    return response.data;
};

export const updateMarriage = async (id: string, data: any) => {
    const response = await api.patch<any>(`/marriages/${id}`, data);
    return response.data;
};

export const deleteMarriage = async (id: string) => {
    const response = await api.delete(`/marriages/${id}`);
    return response.data;
};
