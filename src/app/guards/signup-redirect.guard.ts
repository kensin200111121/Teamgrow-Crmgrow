import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class SignupRedirectGuard implements CanActivate {
  canActivate(): boolean {
    window.location.href =
      'https://material.crmgrow.com/page/66fc3a8e3719556e78e478b5';
    return false;
  }
}
