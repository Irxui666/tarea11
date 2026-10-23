import { permisoGuard } from '../../core/guards/permiso-guard';
import { Routes } from '@angular/router';
import { ClienteList } from './pages/cliente-list/cliente-list';
import { ClienteForm } from './pages/cliente-form/cliente-form';

export const CLIENTES_ROUTES: Routes = [
  { path: '', component: ClienteList, title: 'Clientes' },
  { path: 'nuevo', canActivate: [permisoGuard], data: { permiso: 'CLIENTES_ESCRIBIR' }, component: ClienteForm, title: 'Nuevo cliente' },
  { path: ':id/editar', canActivate: [permisoGuard], data: { permiso: 'CLIENTES_ESCRIBIR' }, component: ClienteForm, title: 'Editar cliente' },
];
