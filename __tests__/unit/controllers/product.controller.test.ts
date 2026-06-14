import type { Request, Response } from 'express';

jest.mock('../../../src/services/product.service');

import * as productService from '../../../src/services/product.service';
import { getCatalog } from '../../../src/controllers/product.controller';

const mockedService = productService as jest.Mocked<typeof productService>;

const makeRes = () => {
  const res = {} as Response;
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const makeReq = (query: Record<string, unknown>) =>
  ({ query } as unknown as Request);

const next = jest.fn();

describe('product.controller getCatalog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('llama getCatalogSince con (undefined, undefined, undefined) cuando no hay query params', async () => {
    const page = { items: [], total: 0 };
    mockedService.getCatalogSince.mockResolvedValue(page as never);

    const req = makeReq({});
    const res = makeRes();

    await (getCatalog as unknown as (
      req: Request,
      res: Response,
      next: jest.Mock,
    ) => Promise<void>)(req, res, next);

    expect(mockedService.getCatalogSince).toHaveBeenCalledWith(
      undefined,
      undefined,
      undefined,
    );
    expect(res.json).toHaveBeenCalledWith(page);
  });

  it('convierte updated_since/limit/offset (String/Number) cuando están presentes', async () => {
    const page = { items: [{ id: 1 }], total: 1 };
    mockedService.getCatalogSince.mockResolvedValue(page as never);

    const req = makeReq({
      updated_since: '2026-01-01T00:00:00Z',
      limit: '50',
      offset: '10',
    });
    const res = makeRes();

    await (getCatalog as unknown as (
      req: Request,
      res: Response,
      next: jest.Mock,
    ) => Promise<void>)(req, res, next);

    expect(mockedService.getCatalogSince).toHaveBeenCalledWith(
      '2026-01-01T00:00:00Z',
      50,
      10,
    );
    expect(res.json).toHaveBeenCalledWith(page);
  });
});
