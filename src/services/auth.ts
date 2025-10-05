import { apiClient } from './api';
import { API_ENDPOINTS } from '@/constants';
import type { AuthUser, User } from '@/types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  displayName: string;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    const response = await apiClient.post<{ data: AuthUser }>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials
    );
    
    if (response.data.accessToken) {
      this.setAuthToken(response.data.accessToken);
    }
    
    return response.data;
  }

  async register(userData: RegisterData): Promise<AuthUser> {
    const response = await apiClient.post<{ data: AuthUser }>(
      API_ENDPOINTS.AUTH.REGISTER,
      userData
    );
    
    if (response.data.accessToken) {
      this.setAuthToken(response.data.accessToken);
    }
    
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } finally {
      this.removeAuthToken();
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<{ data: User }>(API_ENDPOINTS.AUTH.ME);
    return response.data;
  }

  async refreshToken(): Promise<string> {
    const response = await apiClient.post<{ data: { accessToken: string } }>(
      API_ENDPOINTS.AUTH.REFRESH
    );
    
    this.setAuthToken(response.data.accessToken);
    return response.data.accessToken;
  }

  private setAuthToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  private removeAuthToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }
}

export const authService = new AuthService();