// Lee una variable de entorno como entero no-negativo; usa el fallback si falta
// o es inválida.
export function getEnvInt(name: string, fallback: number): number {
  const raw = process.env[name];
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}
