import { Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth-service';
import { mensajeError } from '../../../../core/utils/http-error';

@Component({ selector: 'app-login', imports: [ReactiveFormsModule], templateUrl: './login.html', styleUrl: './login.css' })
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly returnUrl = input<string>();
  readonly expirada = input<string>();
  protected readonly enviando = signal(false);
  protected readonly error = signal('');
  protected readonly verClave = signal(false);
  protected readonly form = inject(NonNullableFormBuilder).group({
    username: ['', [Validators.required, Validators.maxLength(50)]],
    password: ['', [Validators.required, Validators.maxLength(72)]],
  });
  ingresar(): void {
    if (this.enviando()) return;
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.enviando.set(true);
    this.error.set('');
    this.auth.login(this.form.getRawValue()).pipe(finalize(() => this.enviando.set(false))).subscribe({
      next: () => {
        const url = this.returnUrl();
        const destino = url && /^\/(?![\/\\])/.test(url) && !/[\\\u0000-\u001f]/.test(url)
          && !/^\/login(?:[/?#]|$)/.test(url) ? url : '/inicio';
        void this.router.navigateByUrl(destino);
      },
      error: (err: HttpErrorResponse) => {
        this.form.controls.password.reset();
        this.error.set(err.status === 401 ? 'Usuario o contraseña incorrectos' : mensajeError(err));
      },
    });
  }
}
