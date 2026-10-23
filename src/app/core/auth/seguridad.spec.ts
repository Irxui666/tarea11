import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService, CLAVE_SESION } from './auth-service';
import { LoginResponse, Sesion } from './auth.model';
import { environment } from '../../../environments/environment';
import { authInterceptor } from '../interceptors/auth-interceptor';
import { errorInterceptor } from '../interceptors/error-interceptor';
import { authGuard, invitadoGuard } from '../guards/auth-guard';
import { permisoGuard } from '../guards/permiso-guard';
import { Login } from '../../features/auth/pages/login/login';

const respuesta: LoginResponse = { token: 'jwt-prueba', tipo: 'Bearer', expiraEnSegundos: 120,
  username: 'vendedor', nombreCompleto: 'Vendedor de prueba', roles: ['VENDEDOR'], permisos: ['CATALOGO_LEER', 'VENTAS_LEER'] };
const sesion = (): Sesion => ({ ...respuesta, expiraEn: Date.now() + 120_000 });

describe('Seguridad frontend', () => {
  let http: HttpClient;
  let requests: HttpTestingController;
  let router: Router;
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([]),
      provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])), provideHttpClientTesting()] });
    http = TestBed.inject(HttpClient);
    requests = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });
  afterEach(() => { requests.verify(); TestBed.resetTestingModule(); vi.useRealTimers(); sessionStorage.clear(); });

  function entrar() {
    const auth = TestBed.inject(AuthService);
    auth.login({ username: 'vendedor', password: 'prueba' }).subscribe();
    const req = requests.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush(respuesta);
    return auth;
  }

  it('guarda sesión con vencimiento y permisos al iniciar', () => {
    const auth = entrar();
    expect(auth.token()).toBe('jwt-prueba');
    expect(JSON.parse(sessionStorage.getItem(CLAVE_SESION)!).permisos).toContain('VENTAS_LEER');
    expect(auth.sesion()!.expiraEn).toBeGreaterThan(Date.now());
  });
  it('recupera una sesión vigente tras recarga', () => {
    sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion()));
    expect(TestBed.inject(AuthService).sesion()?.username).toBe('vendedor');
  });
  it.each(['{roto', JSON.stringify({ ...sesion(), expiraEn: 1 }),
    JSON.stringify({ token: 'x', expiraEn: Date.now() + 10000 }),
    JSON.stringify({ ...sesion(), permisos: 'CATALOGO_LEER' })])('descarta almacenamiento inválido: %s', texto => {
    sessionStorage.setItem(CLAVE_SESION, texto);
    expect(TestBed.inject(AuthService).token()).toBeNull();
    expect(sessionStorage.getItem(CLAVE_SESION)).toBeNull();
  });
  it('avisa un minuto antes y cierra al vencer recordando la página', () => {
    vi.useFakeTimers();
    const auth = entrar();
    vi.spyOn(router, 'url', 'get').mockReturnValue('/productos');
    vi.advanceTimersByTime(60_000);
    expect(auth.porVencer()).toBe(true);
    expect(auth.token()).toBeTruthy();
    vi.advanceTimersByTime(60_000);
    expect(auth.token()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { expirada: '1', returnUrl: '/productos' } });
  });
  it('cerrar sesión elimina almacenamiento y temporizadores', () => {
    vi.useFakeTimers();
    const auth = entrar(); auth.cerrarSesion();
    expect(sessionStorage.getItem(CLAVE_SESION)).toBeNull();
    expect(auth.autenticado()).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('añade Bearer a la API pero nunca al login', () => {
    entrar(); http.get(`${environment.apiUrl}/productos`).subscribe();
    const req = requests.expectOne(`${environment.apiUrl}/productos`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-prueba'); req.flush([]);
  });
  it.each(['https://externo.example/api/v1/productos', `${environment.apiUrl}-falsa/productos`])('no filtra token a %s', url => {
    entrar(); http.get(url).subscribe(); const req = requests.expectOne(url);
    expect(req.request.headers.has('Authorization')).toBe(false); req.flush([]);
  });
  it('401 de la API cierra sesión y propaga el error', () => {
    const auth = entrar(); const error = vi.fn(); http.get(`${environment.apiUrl}/productos`).subscribe({ error });
    requests.expectOne(`${environment.apiUrl}/productos`).flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.token()).toBeNull(); expect(error).toHaveBeenCalled();
  });
  it.each([403, 500])('error %s conserva la sesión', status => {
    const auth = entrar(); http.get(`${environment.apiUrl}/productos`).subscribe({ error: () => {} });
    requests.expectOne(`${environment.apiUrl}/productos`).flush({}, { status, statusText: 'Error' });
    expect(auth.token()).toBeTruthy(); expect(router.navigate).not.toHaveBeenCalled();
  });
  it('401 del login no provoca redirección', () => {
    TestBed.inject(AuthService).login({ username: 'inactivo', password: 'x' }).subscribe({ error: () => {} });
    requests.expectOne(`${environment.apiUrl}/auth/login`).flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(router.navigate).not.toHaveBeenCalled();
  });
  it('401 externo no cierra la sesión', () => {
    const auth = entrar(); http.get('https://externo.example/datos').subscribe({ error: () => {} });
    requests.expectOne('https://externo.example/datos').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.token()).toBeTruthy();
  });
  it('sin sesión el guard recuerda la URL solicitada', () => {
    const result = TestBed.runInInjectionContext(() => authGuard({} as ActivatedRouteSnapshot, { url: '/ventas' } as RouterStateSnapshot));
    expect(router.serializeUrl(result as never)).toBe('/login?returnUrl=%2Fventas');
  });
  it('con sesión el login redirige al inicio y los permisos bloquean escritura', () => {
    entrar();
    const invitado = TestBed.runInInjectionContext(() => invitadoGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));
    expect(router.serializeUrl(invitado as never)).toBe('/inicio');
    const permiso = TestBed.runInInjectionContext(() => permisoGuard({ data: { permiso: 'CATALOGO_ESCRIBIR' } } as unknown as ActivatedRouteSnapshot, {} as RouterStateSnapshot));
    expect(router.serializeUrl(permiso as never)).toBe('/acceso-denegado');
  });
  it('login vacío muestra validaciones sin enviar HTTP', () => {
    const fixture = TestBed.createComponent(Login); fixture.detectChanges();
    fixture.componentInstance.ingresar(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.error').length).toBe(2);
    requests.expectNone(`${environment.apiUrl}/auth/login`);
  });
  it.each(['/ventas', '//externo.example', 'https://externo.example', '/\\externo.example', '/login'])('retorno seguro tras login: %s', url => {
    const navegar = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(Login); fixture.componentRef.setInput('returnUrl', url); fixture.detectChanges();
    const form = fixture.nativeElement as HTMLElement;
    for (const id of ['username', 'password']) {
      const input = form.querySelector(`#${id}`) as HTMLInputElement; input.value = 'prueba'; input.dispatchEvent(new Event('input'));
    }
    fixture.componentInstance.ingresar(); requests.expectOne(`${environment.apiUrl}/auth/login`).flush(respuesta);
    expect(navegar).toHaveBeenCalledWith(url === '/ventas' ? '/ventas' : '/inicio');
  });
});
