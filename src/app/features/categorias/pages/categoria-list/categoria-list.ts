import { SiPermiso } from '../../../../shared/directives/si-permiso';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { mensajeError } from '../../../../core/utils/http-error';
import { Categoria } from '../../models/categoria.model';
import { CategoriaService } from '../../services/categoria-service';

@Component({
  selector: 'app-categoria-list',
  imports: [SiPermiso, RouterLink],
  templateUrl: './categoria-list.html',
  styleUrl: './categoria-list.css',
})
export class CategoriaList implements OnInit {
  private readonly categoriaService = inject(CategoriaService);
  private readonly route = inject(ActivatedRoute);

  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly exito = signal('');
  protected readonly eliminando = signal(false);
  protected readonly filtro = signal('');

  protected readonly filtradas = computed(() => {
    const texto = this.filtro().trim().toLowerCase();
    return this.categorias().filter(c =>
      c.nombre.toLowerCase().includes(texto)
    );
  });

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.has('guardado')) this.exito.set('Categoría guardada correctamente.');
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.categoriaService.listar().subscribe({
      next: datos => {
        this.categorias.set(datos);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  eliminar(categoria: Categoria): void {
    if (!confirm(`¿Eliminar la categoría "${categoria.nombre}"?`)) {
      return;
    }

    this.eliminando.set(true); this.error.set(null); this.exito.set('');
    this.categoriaService.eliminar(categoria.id).subscribe({
      next: () => {
        this.categorias.update(lista =>
          lista.filter(c => c.id !== categoria.id)
        ); this.eliminando.set(false); this.exito.set('Categoría eliminada correctamente.'); },
      error: (err: HttpErrorResponse) => {
        this.eliminando.set(false); this.error.set(mensajeError(err)); },
    });
  }
}
