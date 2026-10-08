// Binding contracts used by this application (no generated deployment secrets).
interface D1Result<T = Record<string, unknown>> { results: T[]; success: boolean; meta: Record<string, unknown> }
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(column?: string): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run<T = Record<string, unknown>>(): Promise<D1Result<T>>;
}
interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = Record<string, unknown>>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
}
interface Fetcher { fetch(request: Request): Promise<Response> }
declare module 'cloudflare:workers' { export const env: { DB?: D1Database; DB_CONNECTOR_URL?: string; DB_CONNECTOR_TOKEN?: string; DB_CONNECTION_KEY?: string }; }
