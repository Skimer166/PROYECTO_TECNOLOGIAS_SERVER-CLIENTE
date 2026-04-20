import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { User as IUser } from '../types/user';
import { environment } from '../config';

export interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  credits?: number;
}

export interface UpdateUserResponse {
  token?: string;
  message?: string;
}

export interface UploadAvatarResponse {
  id: string;
}

@Injectable({
  providedIn: 'root'
})
export class User {
  private httpClient = inject(HttpClient);


  private baseUrl = environment.apiUrl;

  private logueado = false

  cuentaObservable = new BehaviorSubject<number>(0);
  authStatus = new BehaviorSubject<boolean>(false)

  getCleanUser(): IUser {
    return {
      name: '',
      email: '',
      password: ''
    }
  }

  registerUser(data: Record<string, unknown>): Observable<unknown> {
    return this.httpClient.post(`${this.baseUrl}/auth/signup`, data);
  }

  private getHeaders(): HttpHeaders {
    if (typeof localStorage === 'undefined') return new HttpHeaders();

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token.replace('Bearer ', '')}` : ''
    });
  }

  getUserById(id: string): Observable<UserProfile> {
    return this.httpClient.get<UserProfile>(`${this.baseUrl}/users/${id}`, { headers: this.getHeaders() });
  }

  updateUser(id: string, data: Record<string, unknown>): Observable<UpdateUserResponse> {
    return this.httpClient.put<UpdateUserResponse>(`${this.baseUrl}/users/${id}`, data, { headers: this.getHeaders() });
  }

  uploadAvatar(file: File): Observable<UploadAvatarResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.httpClient.post<UploadAvatarResponse>(`${this.baseUrl}/files/upload`, formData, { headers: this.getHeaders() });
  }
}
