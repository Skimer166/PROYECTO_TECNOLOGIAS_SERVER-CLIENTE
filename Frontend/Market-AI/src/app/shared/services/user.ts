import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { User as IUser } from '../types/user';


@Injectable({
  providedIn: 'root'
})
export class User {

  private apiUrl = 'http://localhost:3001/users';

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

  
}
