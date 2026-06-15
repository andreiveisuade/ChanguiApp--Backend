// Lee una variable de entorno como entero no-negativo; usa el fallback si falta
// o es inválida.
export function getEnvInt(name: string, fallback: number): number {
  const raw = process.env[name];
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

// Lee una variable de entorno como string. Con fallback devuelve siempre string
// (cae al fallback si falta o está vacía); sin fallback devuelve undefined.
// Se lee en cada llamada (no se congela al importar) para no acoplar al entorno
// global y permitir que los tests muten process.env por caso.
export function getEnvString(name: string): string | undefined;
export function getEnvString(name: string, fallback: string): string;
export function getEnvString(name: string, fallback?: string): string | undefined {
  const raw = process.env[name];
  return raw !== undefined && raw !== '' ? raw : fallback;
}
