import { environment } from '../../../environments/environment';

/** Compara origen y límite del path para no filtrar el token a otros servidores. */
export function esApi(url: string): boolean {
  const destino = new URL(url, location.origin);
  const api = new URL(environment.apiUrl, location.origin);
  const base = api.pathname.replace(/\/$/, '');
  return destino.origin === api.origin && (destino.pathname === base || destino.pathname.startsWith(`${base}/`));
}
export function esLogin(url: string): boolean {
  const api = new URL(environment.apiUrl, location.origin);
  return esApi(url) && new URL(url, location.origin).pathname === `${api.pathname.replace(/\/$/, '')}/auth/login`;
}
