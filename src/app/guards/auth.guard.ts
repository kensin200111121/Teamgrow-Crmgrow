import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router
} from '@angular/router';
import { Observable } from 'rxjs';
import { UserService } from '@services/user.service';
import { environment } from '@environments/environment';

const VortexUnaccessibleUrl = [
  '/profile',
  '/profile/general',
  '/profile/signature',
  '/profile/security',
  '/profile/account',
  '/profile/subscription',
  '/profile/billing'
];

const VortexAccessibleUrl = [
  '/profile/gmail',
  '/profile/outlook',
  '/profile/zoom'
];

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  unAuthorizedUrl = [
    '/',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password'
  ];

  constructor(private auth: UserService, private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    // support team check

    if (
      state.url === '/home?accessFrom=support' ||
      next.queryParams.returnUrl === '/home?accessFrom=support'
    ) {
      if (this.auth.isAuthenticatedSupportTeam()) {
        this.router.navigate(['/home']);
        return false;
      }
      return true;
    }
    if (
      this.unAuthorizedUrl.indexOf(state.url) !== -1 ||
      state.url.indexOf('/signup') == 0 ||
      state.url.indexOf('/login') == 0
    ) {
      // UnAuthorized URL
      if (this.auth.isAuthenticated()) {
        this.router.navigate(['/home']);
        return false;
      } else {
        return true;
      }
    } else {
      // Authorized URL
      if (!this.auth.isAuthenticated()) {
        if (state.url.indexOf('contacts') > -1) {
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: state.url }
          });
        } else {
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: state.url }
          });
        }
        return false;
      }
      const url = state.url.split('?')[0];
      if (
        environment.isSspa &&
        !VortexAccessibleUrl.includes(url) &&
        (VortexUnaccessibleUrl.includes(url) || url.startsWith('/profile'))
      ) {
        this.router.navigate(['/home']);
        return false;
      }
      return true;
    }
  }
}
