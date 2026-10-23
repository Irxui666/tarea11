import { permisoGuard } from '../../core/guards/permiso-guard';
import { Routes } from '@angular/router';
import { CategoriaForm } from './pages/categoria-form/categoria-form';
import { CategoriaList } from './pages/categoria-list/categoria-list';

export const CATEGORIAS_ROUTES: Routes = [
  { path: '', component: CategoriaList, title: 'Categorías' },
  { path: 'nuevo', canActivate: [permisoGuard], data: { permiso: 'CATALOGO_ESCRIBIR' }, component: CategoriaForm, title: 'Nueva categoría' },
  { path: ':id/editar', canActivate: [permisoGuard], data: { permiso: 'CATALOGO_ESCRIBIR' }, component: CategoriaForm, title: 'Editar categoría' },
];