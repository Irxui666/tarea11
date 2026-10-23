import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth-service';

export const authGuard: CanActivateFn = (_route, state) => inject(AuthService).token() ? true
  : inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
export const invitadoGuard: CanActivateFn = () => inject(AuthService).token()
  ? inject(Router).createUrlTree(['/inicio']) : true;
