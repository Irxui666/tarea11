import { Directive, effect, inject, input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from '../../core/auth/auth-service';
import { Permiso } from '../../core/auth/auth.model';

@Directive({ selector: '[appSiPermiso]' })
export class SiPermiso {
  private readonly auth = inject(AuthService);
  private readonly plantilla = inject(TemplateRef);
  private readonly contenedor = inject(ViewContainerRef);
  private visible = false;
  readonly appSiPermiso = input.required<Permiso>();
  constructor() {
    effect(() => {
      const permitido = this.auth.tienePermiso(this.appSiPermiso());
      if (permitido && !this.visible) this.contenedor.createEmbeddedView(this.plantilla);
      else if (!permitido && this.visible) this.contenedor.clear();
      this.visible = permitido;
    });
  }
}
