import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Cliente } from '../../../clientes/models/cliente.model';
import { ClienteService } from '../../../clientes/services/cliente-service';
import { Producto } from '../../../productos/models/producto.model';
import { ProductoService } from '../../../productos/services/producto-service';
import { VentaService } from '../../services/venta-service';
import { VentaRequest } from '../../models/venta.model';
import { coincide } from '../../../../core/utils/texto';
import { redondear } from '../../../../core/utils/numeros';
import { mensajeError } from '../../../../core/utils/http-error';
interface LineaForm {
  productoId: FormControl<number>;
  cantidad: FormControl<number>;
}
@Component({
  selector: 'app-venta-form',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe],
  templateUrl: './venta-form.html',
  styleUrl: './venta-form.css',
})
export class VentaForm implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(VentaService);
  private readonly clienteService = inject(ClienteService);
  private readonly productoService = inject(ProductoService);
  private readonly router = inject(Router);
  readonly clientes = signal<Cliente[]>([]);
  readonly productos = signal<Producto[]>([]);
  readonly cargando = signal(true);
  readonly cargaFallida = signal(false);
  readonly confirmando = signal(false);
  readonly guardando = signal(false);
  readonly error = signal('');
  readonly imprimirAlRegistrar = signal(true);
  readonly form = this.fb.group({
    clienteId: this.fb.control<number | null>(null, Validators.required),
    detalles: this.fb.array<FormGroup<LineaForm>>([], Validators.required),
  });
  get detalles() {
    return this.form.controls.detalles;
  }
  readonly buscarCliente = this.fb.control('');
  readonly buscarProducto = this.fb.control('');
  readonly textoCliente = toSignal(this.buscarCliente.valueChanges, { initialValue: '' });
  readonly textoProducto = toSignal(this.buscarProducto.valueChanges, { initialValue: '' });
  private readonly valores = toSignal(this.form.valueChanges, { initialValue: this.form.value });
  readonly clientesEncontrados = computed(() =>
    this.textoCliente().trim()
      ? this.clientes()
          .filter((c) => c.estado && coincide(this.textoCliente(), c.dni, c.nombres, c.apellidos))
          .slice(0, 6)
      : [],
  );
  readonly productosEncontrados = computed(() =>
    this.textoProducto().trim()
      ? this.productos()
          .filter(
            (p) =>
              p.estado &&
              p.stock > 0 &&
              coincide(this.textoProducto(), p.nombre, p.categoriaNombre),
          )
          .slice(0, 6)
      : [],
  );
  readonly clienteElegido = computed(() =>
    this.clientes().find((c) => c.id === this.valores().clienteId),
  );
  readonly lineas = computed(() =>
    (this.valores().detalles ?? []).map((d) => {
      const producto = this.productos().find((p) => p.id === d.productoId);
      const cantidad = Number(d.cantidad);
      const precio = producto?.precio ?? 0;
      return {
        producto,
        cantidad,
        precio,
        subtotal: Number.isFinite(cantidad) ? redondear(precio * cantidad) : 0,
        excedeStock: !producto || !producto.estado || cantidad > producto.stock,
      };
    }),
  );
  readonly total = computed(() => redondear(this.lineas().reduce((sum, l) => sum + l.subtotal, 0)));
  ngOnInit() {
    this.cargarCatalogos();
  }
  cargarCatalogos() {
    if (this.guardando() || this.confirmando()) return;
    this.cargando.set(true);
    this.cargaFallida.set(false);
    this.error.set('');
    forkJoin({
      clientes: this.clienteService.listar(),
      productos: this.productoService.listar(),
    }).subscribe({
      next: (r) => {
        this.clientes.set(r.clientes);
        this.productos.set(r.productos);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(mensajeError(e));
        this.cargando.set(false);
        this.cargaFallida.set(true);
      },
    });
  }
  elegirCliente(c: Cliente) {
    if (!c.estado || this.confirmando()) return;
    this.form.controls.clienteId.setValue(c.id);
    this.buscarCliente.setValue('');
  }
  cambiarCliente() {
    if (!this.confirmando()) this.form.controls.clienteId.setValue(null);
  }
  cantidadEnDetalle(id: number) {
    return (
      this.detalles.controls.find((l) => l.controls.productoId.value === id)?.controls.cantidad
        .value ?? 0
    );
  }
  agregarProducto(p: Producto) {
    if (!p.estado || p.stock < 1 || this.confirmando() || this.guardando()) return;
    const existente = this.detalles.controls.find((l) => l.controls.productoId.value === p.id);
    if (existente)
      existente.controls.cantidad.setValue(Number(existente.controls.cantidad.value) + 1);
    else
      this.detalles.push(
        this.fb.group({
          productoId: [p.id, Validators.required],
          cantidad: [
            1,
            [
              Validators.required,
              Validators.min(1),
              Validators.max(2147483647),
              Validators.pattern(/^\d+$/),
            ],
          ],
        }),
      );
    this.buscarProducto.setValue('');
  }
  agregarPrimero(event: Event) {
    event.preventDefault();
    const p = this.productosEncontrados()[0];
    if (p) this.agregarProducto(p);
  }
  quitarLinea(i: number) {
    if (!this.confirmando() && !this.guardando()) this.detalles.removeAt(i);
  }
  private valida() {
    this.form.markAllAsTouched();
    return (
      this.form.valid &&
      !!this.clienteElegido()?.estado &&
      this.lineas().length > 0 &&
      !this.lineas().some((l) => l.excedeStock || !Number.isSafeInteger(l.cantidad))
    );
  }
  revisar() {
    if (this.cargando() || this.cargaFallida() || this.guardando() || this.confirmando()) return;
    this.error.set('');
    if (!this.valida()) {
      this.error.set('Revise el cliente, los productos, las cantidades y el stock disponible.');
      return;
    }
    this.confirmando.set(true);
  }
  volver() {
    if (!this.guardando()) this.confirmando.set(false);
  }
  confirmar() {
    if (!this.confirmando() || this.guardando() || !this.valida()) return;
    const v = this.form.getRawValue();
    const dto: VentaRequest = {
      clienteId: Number(v.clienteId),
      detalles: v.detalles.map((d) => ({
        productoId: Number(d.productoId),
        cantidad: Number(d.cantidad),
      })),
    };
    this.guardando.set(true);
    this.error.set('');
    this.service.registrar(dto).subscribe({
      next: (venta) =>
        this.router.navigate(['/ventas', venta.id], {
          queryParams: { nueva: 1, ...(this.imprimirAlRegistrar() ? { imprimir: 1 } : {}) },
        }),
      error: (e) => {
        this.guardando.set(false);
        this.confirmando.set(false);
        this.error.set(mensajeError(e));
        this.productoService
          .listar()
          .subscribe({ next: (p) => this.productos.set(p), error: () => {} });
      },
    });
  }
}
