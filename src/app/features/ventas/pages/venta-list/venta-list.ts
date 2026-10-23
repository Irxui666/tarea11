import { SiPermiso } from '../../../../shared/directives/si-permiso';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { VentaService } from '../../services/venta-service';
import { EstadoVenta, FiltroVentas, Venta } from '../../models/venta.model';
import { PaginaResponse } from '../../../../core/models/pagina-response';
import { Cliente } from '../../../clientes/models/cliente.model';
import { ClienteService } from '../../../clientes/services/cliente-service';
import { mensajeError } from '../../../../core/utils/http-error';
import { redondear } from '../../../../core/utils/numeros';
@Component({
  selector: 'app-venta-list',
  imports: [SiPermiso, ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './venta-list.html',
})
export class VentaList implements OnInit, OnDestroy {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(VentaService);
  private readonly clienteService = inject(ClienteService);
  private request?: Subscription;
  readonly clientes = signal<Cliente[]>([]);
  readonly error = signal('');
  readonly errorClientes = signal('');
  readonly cargando = signal(false);
  readonly resultado = signal<PaginaResponse<Venta> | null>(null);
  readonly ahora = signal(new Date());
  readonly filtros = this.fb.group({
    clienteId: this.fb.control<number | null>(null),
    estado: this.fb.control<EstadoVenta | null>(null),
    desde: [''],
    hasta: [''],
  });
  readonly aplicados = signal<FiltroVentas>({
    clienteId: null,
    estado: null,
    desde: null,
    hasta: null,
  });
  readonly totalPagina = computed(() =>
    redondear(
      (this.resultado()?.contenido ?? [])
        .filter((v) => v.estado === 'REGISTRADA')
        .reduce((s, v) => s + v.total, 0),
    ),
  );
  readonly resumenFiltros = computed(() => {
    const f = this.aplicados();
    const c = this.clientes().find((c) => c.id === f.clienteId);
    return (
      [
        c ? `Cliente: ${c.apellidos}, ${c.nombres}` : f.clienteId ? `Cliente ${f.clienteId}` : '',
        f.estado ? `Estado: ${f.estado}` : '',
        f.desde ? `Desde: ${f.desde}` : '',
        f.hasta ? `Hasta: ${f.hasta}` : '',
      ]
        .filter(Boolean)
        .join(' · ') || 'Todas las ventas'
    );
  });
  ngOnInit() {
    this.clienteService
      .listar()
      .subscribe({
        next: (c) => this.clientes.set(c),
        error: (e) => this.errorClientes.set(mensajeError(e)),
      });
    this.cargar(0);
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
    this.aplicados.set({ ...f, desde: f.desde || null, hasta: f.hasta || null });
    this.cargar(0);
  }
  limpiar() {
    this.filtros.reset();
    this.buscar();
  }
  irA(pagina: number) {
    const r = this.resultado();
    if (!r || pagina < 0 || pagina >= r.totalPaginas || this.cargando()) return;
    this.cargar(pagina);
  }
  reintentar() {
    this.cargar(this.resultado()?.pagina ?? 0);
  }
  private cargar(pagina: number) {
    this.request?.unsubscribe();
    this.cargando.set(true);
    this.error.set('');
    this.resultado.set(null);
    this.request = this.service.buscar(this.aplicados(), pagina, 10).subscribe({
      next: (r) => {
        this.resultado.set(r);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(mensajeError(e));
        this.cargando.set(false);
      },
    });
  }
  imprimirConsulta() {
    if (!this.resultado()?.contenido.length || this.cargando()) return;
    this.ahora.set(new Date());
    setTimeout(() => window.print());
  }
}
