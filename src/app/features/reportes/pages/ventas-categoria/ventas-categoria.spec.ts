import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ReporteCategorias } from './ventas-categoria';
describe('ReporteCategorias', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [ReporteCategorias],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }),
  );
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it('suma montos y cantidades del reporte', () => {
    const f = TestBed.createComponent(ReporteCategorias);
    f.detectChanges();
    const r = TestBed.inject(HttpTestingController).expectOne(
      '/api/v1/reportes/ventas-por-categoria',
    );
    r.flush([
      { categoriaId: 1, categoriaNombre: 'Analgésicos', cantidadVendida: 3, montoTotal: 7.5 },
      { categoriaId: 2, categoriaNombre: 'Vitaminas', cantidadVendida: 2, montoTotal: 2.2 },
    ]);
    expect(f.componentInstance.total()).toBe(9.7);
    expect(f.componentInstance.unidades()).toBe(5);
 expect(f.componentInstance.porcentaje(7.5)).toBe(100); expect(f.componentInstance.porcentaje(2.2)).toBeCloseTo(29.3333); f.detectChanges(); expect(f.nativeElement.querySelector('.barra').style.width).toBe('100%');
  });
  it('no consulta fechas invertidas', () => {
    const c = TestBed.createComponent(ReporteCategorias).componentInstance;
    c.filtros.setValue({ desde: '2026-10-10', hasta: '2026-10-01' });
    c.buscar();
    expect(c.error()).toContain('posterior');
    TestBed.inject(HttpTestingController).expectNone((r) => r.url.includes('/reportes'));
  });
  it('R-03 | carga vacio error y recuperacion', () => {
    const f=TestBed.createComponent(ReporteCategorias); f.detectChanges(); const http=TestBed.inject(HttpTestingController);
    expect(f.nativeElement.textContent).toContain('Cargando reporte');
    http.expectOne('/api/v1/reportes/ventas-por-categoria').flush([]); f.detectChanges();
    expect(f.nativeElement.textContent).toContain('No hay ventas en el periodo seleccionado'); expect(f.componentInstance.porcentaje(0)).toBe(0);
    f.componentInstance.buscar(); http.expectOne('/api/v1/reportes/ventas-por-categoria').flush({message:'Error de prueba'}, {status:500,statusText:'Error'}); f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Error de prueba');
    f.componentInstance.buscar(); http.expectOne('/api/v1/reportes/ventas-por-categoria').flush([]); expect(f.componentInstance.error()).toBe('');
  });

});
