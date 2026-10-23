import { permisoGuard } from '../../core/guards/permiso-guard';
import { Routes } from '@angular/router';
export const VENTAS_ROUTES: Routes = [
  {
    path: '',
    title: 'Consulta de ventas',
    loadComponent: () => import('./pages/venta-list/venta-list').then((m) => m.VentaList),
  },
  {
    path: 'nueva', canActivate: [permisoGuard], data: { permiso: 'VENTAS_REGISTRAR' },
    title: 'Nueva venta',
    loadComponent: () => import('./pages/venta-form/venta-form').then((m) => m.VentaForm),
  },
  {
    path: ':id',
    title: 'Comprobante de venta',
    loadComponent: () => import('./pages/venta-detalle/venta-detalle').then((m) => m.VentaDetalle),
  },
];
