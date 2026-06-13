// Error de dominio con status HTTP. El error handler global
// (src/middleware/errorHandler.ts) lo mapea a la respuesta { error: message }.
export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}
