import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../../../core/auth/auth-service';
@Component({ selector: 'app-mi-cuenta', imports: [DatePipe], template: `
  <section class="card"><h2>Mi cuenta</h2>
    @if (auth.sesion(); as s) {
      <dl><dt>Nombre completo</dt><dd>{{ s.nombreCompleto }}</dd>
        <dt>Usuario</dt><dd>{{ s.username }}</dd><dt>Roles</dt><dd>{{ s.roles.join(' · ') }}</dd>
        <dt>Vencimiento de sesión</dt><dd>{{ s.expiraEn | date: 'dd/MM/yyyy HH:mm:ss' }}</dd></dl>
      <h3>Permisos</h3><ul>@for (p of s.permisos; track p) { <li>{{ p }}</li> }</ul>
      <button class="btn" (click)="auth.cerrarSesion()">Cerrar sesión</button>
    }
  </section>` })
export class MiCuenta { protected readonly auth = inject(AuthService); }
