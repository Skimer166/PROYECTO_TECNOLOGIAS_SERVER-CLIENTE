import { Routes } from '@angular/router';
import { HomePage } from './pages/home-page/home-page';
import { LandingPage } from './pages/landing-page/landing-page';
//import path from 'path';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';

export const routes: Routes = [
    {path: 'landing-page', component: LandingPage},
    {path: '', redirectTo: 'landing-page', pathMatch: "full"},
    {path: 'home-page', component: HomePage},
    {path: 'login', component: Login},
    {path: 'register', component: Register},
];