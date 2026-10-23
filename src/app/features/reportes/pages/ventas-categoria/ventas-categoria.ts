import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ReporteService } from '../../services/reporte-service';
import { VentaPorCategoria } from '../../models/reporte.model';
import { mensajeError } from '../../../../core/utils/http-error';
import { redondear } from '../../../../core/utils/numeros';
@Component({
  selector: 'app-ventas-categoria',
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe],
  templateUrl: './ventas-categoria.html',
  styleUrl: './ventas-categoria.css',
})
export class ReporteCategorias implements OnInit, OnDestroy {
  private readonly service = inject(ReporteService);
  private readonly fb = inject(NonNullableFormBuilder);
  private request?: Subscription;
  readonly filtros = this.fb.group({ desde: [''], hasta: [''] });
  readonly filas = signal<VentaPorCategoria[]>([]);
  readonly error = signal('');
  readonly cargando = signal(false);
  readonly consultado = signal(false);
  readonly periodo = signal('Todas las fechas');
  readonly ahora = signal(new Date());
  readonly total = computed(() => redondear(this.filas().reduce((s, f) => s + f.montoTotal, 0)));
  readonly unidades = computed(() => this.filas().reduce((s, f) => s + f.cantidadVendida, 0));
  readonly mayorMonto = computed(() => Math.max(0, ...this.filas().map(f => f.montoTotal)));
  porcentaje(monto: number): number { return this.mayorMonto() > 0 ? monto / this.mayorMonto() * 100 : 0; }
  ngOnInit() {
    this.buscar();
  }
  ngOnDestroy() {
    this.request?.unsubscribe();
  }
  buscar() {
    const f = this.filtros.getRawValue();
    if (f.desde && f.hasta && f.desde > f.hasta) {
      this.error.set('La fecha desde no puede ser posterior a la fecha hasta.');
      return;
    }
    this.request?.unsubscribe();
    this.cargando.set(true);
    this.consultado.set(false);
    this.filas.set([]);
    this.error.set('');
    this.request = this.service.ventasPorCategoria(f.desde, f.hasta).subscribe({
      next: (r) => {
        this.filas.set(r);
        this.periodo.set(
          [f.desde ? `Desde ${f.desde}` : '', f.hasta ? `Hasta ${f.hasta}` : '']
            .filter(Boolean)
            .join(' · ') || 'Todas las fechas',
        );
        this.cargando.set(false);
        this.consultado.set(true);
      },
      error: (e) => {
        this.error.set(mensajeError(e));
        this.cargando.set(false);
      },
    });
  }
  limpiar() {
    this.filtros.reset();
    this.buscar();
  }
  imprimir() {
    if (!this.consultado() || this.cargando() || !this.filas().length) return;
    this.ahora.set(new Date());
    setTimeout(() => window.print());
  }
}
