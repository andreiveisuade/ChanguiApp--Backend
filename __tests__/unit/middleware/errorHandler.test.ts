import type { Request, Response } from 'express';
import { errorHandler } from '../../../src/middleware/errorHandler';
import { ApiError } from '../../../src/utils/ApiError';

describe('errorHandler', () => {
  const ORIGINAL_ENV = process.env.NODE_ENV;
  const req = {} as Request;
  const next = jest.fn();
  let res: Response;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    res = { status: statusMock, json: jsonMock } as unknown as Response;
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.NODE_ENV = ORIGINAL_ENV;
    jest.restoreAllMocks();
  });

  it('400 ante JSON malformado', () => {
    errorHandler({ type: 'entity.parse.failed', message: 'bad json' }, req, res, next);
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('JSON malformado') }),
    );
  });

  it('413 ante body demasiado grande', () => {
    errorHandler({ type: 'entity.too.large' }, req, res, next);
    expect(statusMock).toHaveBeenCalledWith(413);
  });

  it('usa el status y mensaje del ApiError', () => {
    errorHandler(new ApiError('No encontrado', 404), req, res, next);
    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'No encontrado' });
  });

  it('pasa el mensaje en errores 4xx con status custom (aun en produccion)', () => {
    process.env.NODE_ENV = 'production';
    errorHandler({ status: 422, message: 'Dato invalido' }, req, res, next);
    expect(statusMock).toHaveBeenCalledWith(422);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Dato invalido' });
  });

  it('usa fallback de descripcion en 4xx sin mensaje', () => {
    errorHandler({ status: 400 }, req, res, next);
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Error sin descripcion' });
  });

  it('oculta el detalle de 5xx con status custom en produccion', () => {
    process.env.NODE_ENV = 'production';
    errorHandler({ status: 503, message: 'supabase down' }, req, res, next);
    expect(statusMock).toHaveBeenCalledWith(503);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
  });

  it('500 ante error inesperado, con mensaje fuera de produccion', () => {
    process.env.NODE_ENV = 'test';
    errorHandler(new Error('boom'), req, res, next);
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'boom' });
  });

  it('500 ante error inesperado, oculto en produccion', () => {
    process.env.NODE_ENV = 'production';
    errorHandler({}, req, res, next);
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
  });
});
