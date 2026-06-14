import type { NextFunction, Request, Response } from 'express';
import { list } from '../../../src/controllers/purchase.controller';
import { purchaseService } from '../../../src/services/purchase.service';

jest.mock('../../../src/services/purchase.service');

const mockedList = purchaseService.list as jest.Mock;

describe('purchase.controller list', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('pasa status undefined cuando req.query.status no es string (array)', async () => {
    mockedList.mockResolvedValue([]);
    const req = { user: { id: 'u1' }, query: { status: ['a', 'b'] } } as unknown as Request;
    const res = { json: jest.fn() } as unknown as Response;
    const next = jest.fn() as unknown as NextFunction;

    list(req, res, next);
    await Promise.resolve();

    expect(mockedList).toHaveBeenCalledWith('u1', undefined);
    expect(next).not.toHaveBeenCalled();
  });
});
