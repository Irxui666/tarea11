import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, PERMISOS, Permiso, Sesion } from './auth.model';

export const CLAVE_SESION = 'pharmasoft.sesion';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly actual = signal<Sesion | null>(this.leerSesionGuardada());
  private temporizador?: ReturnType<typeof setTimeout>;
  private aviso?: ReturnType<typeof setTimeout>;
  readonly sesion = this.actual.asReadonly();
  readonly porVencer = signal(false);
  readonly autenticado = computed(() => this.actual() !== null);

  constructor() {
    const sesion = this.actual();
    if (sesion) this.programar(sesion);
    inject(DestroyRef).onDestroy(() => this.cancelar());
  }

  login(credenciales: LoginRequest) {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, credenciales).pipe(
      map(r => {
        const sesion: Sesion = { token: r.token, expiraEn: Date.now() + r.expiraEnSegundos * 1000,
          username: r.username, nombreCompleto: r.nombreCompleto, roles: r.roles, permisos: r.permisos };
        if (!this.valida(sesion)) throw new Error('Respuesta de sesión inválida');
        return sesion;
      }),
      tap(sesion => {
        sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
        this.actual.set(sesion);
        this.programar(sesion);
      }),
    );
  }

  cerrarSesion(motivo?: 'expirada', volverA?: string): void {
    this.cancelar();
    sessionStorage.removeItem(CLAVE_SESION);
    this.actual.set(null);
    this.porVencer.set(false);
    const queryParams: Record<string, string> = {};
    if (motivo) queryParams['expirada'] = '1';
    if (volverA && !volverA.startsWith('/login')) queryParams['returnUrl'] = volverA;
    void this.router.navigate(['/login'], { queryParams });
  }

  token(): string | null {
    const sesion = this.actual();
    return sesion && Date.now() < sesion.expiraEn ? sesion.token : null;
  }

  tienePermiso(permiso: Permiso): boolean {
    return !!this.token() && (this.actual()?.permisos.includes(permiso) ?? false);
  }

  private cancelar(): void { clearTimeout(this.temporizador); clearTimeout(this.aviso); }
  private programar(sesion: Sesion): void {
    this.cancelar();
    this.porVencer.set(false);
    const restante = sesion.expiraEn - Date.now();
    this.aviso = setTimeout(() => this.porVencer.set(true), Math.max(restante - 60_000, 0));
    this.temporizador = setTimeout(() => this.cerrarSesion('expirada', this.router.url), Math.max(restante, 0));
  }

  private valida(s: unknown): s is Sesion {
    if (!s || typeof s !== 'object') return false;
    const v = s as Sesion;
    return typeof v.token === 'string' && !!v.token && Number.isFinite(v.expiraEn) && v.expiraEn > Date.now()
      && typeof v.username === 'string' && !!v.username && typeof v.nombreCompleto === 'string'
      && Array.isArray(v.roles) && v.roles.every(r => typeof r === 'string')
      && Array.isArray(v.permisos) && v.permisos.every(p => PERMISOS.includes(p));
  }

  private leerSesionGuardada(): Sesion | null {
    try {
      const texto = sessionStorage.getItem(CLAVE_SESION);
      if (!texto) return null;
      const sesion: unknown = JSON.parse(texto);
      if (this.valida(sesion)) return sesion;
    } catch {}
    sessionStorage.removeItem(CLAVE_SESION);
    return null;
  }
}
