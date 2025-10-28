import { Routes } from '@angular/router';
import { HomePage } from './pages/home-page/home-page';
import { LandingPage } from './pages/landing-page/landing-page';
import path from 'path';
import { Register } from './pages/register/register';

export const routes: Routes = [
    {path: 'landing-page', component: LandingPage},
    {path: '', redirectTo: 'landing-page', pathMatch: "full"},
    {path: 'home-page', component: HomePage},
    //login
    {path: 'register', component: Register},
];