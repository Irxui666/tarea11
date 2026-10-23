import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth-service';
import { esApi, esLogin } from '../auth/api-url';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();
  return next(token && esApi(req.url) && !esLogin(req.url)
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req);
};
