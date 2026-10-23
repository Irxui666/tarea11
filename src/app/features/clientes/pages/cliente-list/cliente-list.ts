import { SiPermiso } from '../../../../shared/directives/si-permiso';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ClienteService } from '../../services/cliente-service';
import { Cliente } from '../../models/cliente.model';
import { mensajeError } from '../../../../core/utils/http-error';

@Component({ selector: 'app-cliente-list', imports: [SiPermiso, RouterLink], templateUrl: './cliente-list.html' })
export class ClienteList implements OnInit {
  private readonly service = inject(ClienteService);
  private readonly route = inject(ActivatedRoute);
  readonly clientes = signal<Cliente[]>([]);
  readonly cargando = signal(false);
  readonly eliminando = signal(false);
  readonly error = signal('');
  readonly exito = signal('');
  readonly filtro = signal('');
  readonly filtrados = computed(() => {
    const q = this.filtro().trim().toLocaleLowerCase();
    return this.clientes().filter(c => `${c.dni} ${c.nombres} ${c.apellidos} ${c.email}`.toLocaleLowerCase().includes(q));
  });
  ngOnInit() { if (this.route.snapshot.queryParamMap.has('guardado')) this.exito.set('Cliente guardado correctamente.'); this.cargar(); }
  cargar() {
    this.cargando.set(true); this.error.set('');
    this.service.listar().subscribe({ next: data => { this.clientes.set(data); this.cargando.set(false); }, error: e => { this.error.set(mensajeError(e)); this.cargando.set(false); } });
  }
  eliminar(cliente: Cliente) {
    if (!confirm(`¿Eliminar al cliente ${cliente.nombres} ${cliente.apellidos}?`)) return;
    this.eliminando.set(true); this.error.set(''); this.exito.set('');
    this.service.eliminar(cliente.id).subscribe({ next: () => { this.clientes.update(data => data.filter(c => c.id !== cliente.id)); this.eliminando.set(false); this.exito.set('Cliente eliminado.'); }, error: e => { this.eliminando.set(false); this.error.set(mensajeError(e)); } });
  }
}
