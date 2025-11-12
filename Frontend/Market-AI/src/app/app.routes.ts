import { Routes } from '@angular/router';
import { HomePage } from './pages/home-page/home-page';
import { LandingPage } from './pages/landing-page/landing-page';
//import path from 'path';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { authActivateGuard, guestOnlyGuard } from './shared/guards/auth-guard-guard';

export const routes: Routes = [
    {path: 'landing-page', component: LandingPage},
    {path: '', redirectTo: 'landing-page', pathMatch: "full"},
    {path: 'home-page', component: HomePage, canActivate:[authActivateGuard]},
    {path: 'login', component: Login, canActivate:[guestOnlyGuard]},
    {path: 'register', component: Register, canActivate:[guestOnlyGuard]},
];