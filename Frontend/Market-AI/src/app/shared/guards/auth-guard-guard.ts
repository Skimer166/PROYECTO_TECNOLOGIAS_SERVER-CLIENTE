import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, CanMatchFn, CanActivateFn, UrlTree } from '@angular/router';

//rutas permitidas si NO estan logueados
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
  return PUBLIC_WHITELIST.some(prefix => url.startsWith(prefix));
}


export const authActivateGuard: CanActivateFn = (route, state): boolean | UrlTree => {
  const router = inject(Router);

  if (hasToken()) return true; //si esta logueado pasa
  if (isWhitelisted(state.url)) return true; //si esta en la whitelist pasa
  return router.parseUrl('/login'); //si no esta log y no es white lo redirige
};

//si ya esta log, el usuario, lo redirige al landing page
export const guestOnlyGuard: CanMatchFn = (): boolean | UrlTree => {
  const router = inject(Router);
  if (hasToken()) return router.parseUrl('/'); 
  return true;
};