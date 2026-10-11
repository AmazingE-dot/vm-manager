import type { User } from '@vm-manager/shared';
import { httpClient } from '../../lib/httpClient';

interface AuthResponse {
  user: User;
}

export const authApi = {
  login: (email: string, password: string) =>
    httpClient.post<AuthResponse>('/login', { email, password }),
  logout: () => httpClient.post<void>('/logout'),
  me: () => httpClient.get<AuthResponse>('/me'),
};
