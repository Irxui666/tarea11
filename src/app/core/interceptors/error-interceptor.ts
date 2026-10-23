import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth-service';
import { esApi, esLogin } from '../auth/api-url';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return next(req).pipe(catchError((err: HttpErrorResponse) => {
    if (err.status === 401 && esApi(req.url) && !esLogin(req.url) && !router.url.startsWith('/login')) {
      auth.cerrarSesion('expirada', router.url);
    }
    return throwError(() => err);
  }));
};
