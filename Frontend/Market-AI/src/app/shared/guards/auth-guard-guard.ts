import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, CanMatchFn, CanActivateFn, UrlTree } from '@angular/router';

const PUBLIC_WHITELIST = ['/login', '/register', '/landing-page'];

function hasToken(): boolean {
  const platformId = inject(PLATFORM_ID);
  
  if (!isPlatformBrowser(platformId)) return false;  
  try {
    return !!(sessionStorage.getItem('token') || localStorage.getItem('token'));
  } catch {
    return false;
  }
}

function isWhitelisted(url: string): boolean {
  const cleanUrl = url.split('?')[0];
  return PUBLIC_WHITELIST.includes(cleanUrl);
}

export const authActivateGuard: CanActivateFn = (route, state): boolean | UrlTree => {
  const router = inject(Router);

  if (hasToken()) 
    return true; 

  if (isWhitelisted(state.url)) 
    return true; 
  
  return router.parseUrl('/login');
};

export const guestOnlyGuard: CanMatchFn = (): boolean | UrlTree => {
  const router = inject(Router);
  
  if (hasToken()) return router.parseUrl('/'); 
  return true;
};