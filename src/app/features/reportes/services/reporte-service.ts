import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { map, Observable } from 'rxjs';
import { VentaPorCategoria } from '../models/reporte.model';
@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly http = inject(HttpClient);
  ventasPorCategoria(desde: string | null, hasta: string | null): Observable<VentaPorCategoria[]> {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    return this.http.get<(VentaPorCategoria & {nombreCategoria?: string; cantidadTotal?: number})[]>(
      `${environment.apiUrl}/reportes/ventas-por-categoria`,
      { params },
    ).pipe(map(filas => filas.map(f => ({categoriaId: f.categoriaId, categoriaNombre: f.categoriaNombre ?? f.nombreCategoria ?? '', cantidadVendida: f.cantidadVendida ?? f.cantidadTotal ?? 0, montoTotal: f.montoTotal}))));
  }
}
