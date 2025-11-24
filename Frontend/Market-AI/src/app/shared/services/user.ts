import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { User as IUser } from '../types/user';


@Injectable({
  providedIn: 'root'
})
export class User {

  private apiUrl = 'http://localhost:3001/users';
  private filesUrl = 'http://localhost:3001/files';

  constructor(private httpClient: HttpClient){}

  private logueado: boolean = false

  cuentaObservable: BehaviorSubject<number> = new BehaviorSubject(0);
  authStatus: BehaviorSubject<boolean> = new BehaviorSubject(false)

  getCleanUser(): IUser {
    return {
      name: '',
      email: '',
      password: ''
    }
  }

  registerUser(data: any): Observable<any> {
    return this.httpClient.post(`${this.apiUrl}/register`, data);
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token.replace('Bearer ', '')}` : ''
    });
  }

  getUserById(id: string): Observable<any> {
    return this.httpClient.get(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  updateUser(id: string, data: any): Observable<any> {
    return this.httpClient.put(`${this.apiUrl}/${id}`, data, { headers: this.getHeaders() });
  }

  uploadAvatar(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.httpClient.post(`${this.filesUrl}/upload`, formData, { headers: this.getHeaders() });
  }

  
}
