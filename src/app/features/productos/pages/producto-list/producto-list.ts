import { SiPermiso } from '../../../../shared/directives/si-permiso';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductoService } from '../../services/producto-service';
import { Producto } from '../../models/producto.model';
import { mensajeError } from '../../../../core/utils/http-error';
import { coincide } from '../../../../core/utils/texto';
@Component({
  selector: 'app-producto-list',
  imports: [SiPermiso, RouterLink, CurrencyPipe],
  templateUrl: './producto-list.html',
})
export class ProductoList implements OnInit {
  private readonly service = inject(ProductoService);
  private readonly route = inject(ActivatedRoute);
  readonly productos = signal<Producto[]>([]);
  readonly filtro = signal('');
  readonly filtrados = computed(() =>
    this.productos().filter((p) => coincide(this.filtro(), p.nombre, p.categoriaNombre)),
  );
  readonly cargando = signal(false);
  readonly eliminando = signal(false);
  readonly error = signal('');
  readonly exito = signal('');
  ngOnInit() {
    if (this.route.snapshot.queryParamMap.has('guardado'))
      this.exito.set('Producto guardado correctamente.');
    this.cargar();
  }
  cargar() {
    this.cargando.set(true);
    this.error.set('');
    this.service.listar().subscribe({
      next: (p) => {
        this.productos.set(p);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(mensajeError(e));
        this.cargando.set(false);
      },
    });
  }
  eliminar(p: Producto) {
    if (this.eliminando() || !confirm(`¿Eliminar el producto ${p.nombre}?`)) return;
    this.eliminando.set(true);
    this.error.set('');
    this.exito.set('');
    this.service.eliminar(p.id).subscribe({
      next: () => {
        this.productos.update((v) => v.filter((x) => x.id !== p.id));
        this.eliminando.set(false);
        this.exito.set('Producto eliminado.');
      },
      error: (e) => {
        this.error.set(mensajeError(e));
        this.eliminando.set(false);
      },
    });
  }
}
