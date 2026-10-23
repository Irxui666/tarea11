import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ReporteService } from './reporte-service';
describe('ReporteService autónoma',()=>{
 beforeEach(()=>TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting()]}));
 afterEach(()=>TestBed.inject(HttpTestingController).verify());
 it('R-04 | omite fechas vacias y adapta contrato tarea05',()=>{TestBed.inject(ReporteService).ventasPorCategoria(null,'').subscribe(x=>expect(x).toEqual([{categoriaId:1,categoriaNombre:'Analgesicos',cantidadVendida:3,montoTotal:56.7}]));const r=TestBed.inject(HttpTestingController).expectOne('/api/v1/reportes/ventas-por-categoria');expect(r.request.params.keys()).toEqual([]);r.flush([{categoriaId:1,nombreCategoria:'Analgesicos',cantidadTotal:3,montoTotal:56.7}]);});
 it('R-05 | solo envia fecha con valor y admite contrato de guia',()=>{TestBed.inject(ReporteService).ventasPorCategoria('2026-10-01',null).subscribe(x=>expect(x[0].cantidadVendida).toBe(2));const r=TestBed.inject(HttpTestingController).expectOne('/api/v1/reportes/ventas-por-categoria?desde=2026-10-01');expect(r.request.params.has('hasta')).toBe(false);r.flush([{categoriaId:1,categoriaNombre:'A',cantidadVendida:2,montoTotal:25}]);});
});
