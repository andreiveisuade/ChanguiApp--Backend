import type { NextFunction, Response } from 'express';
import * as cartController from '../../../src/controllers/cart.controller';
import * as cartService from '../../../src/services/cart.service';
import type { AuthedRequest } from '../../../src/types/http';

jest.mock('../../../src/services/cart.service');

describe('cart.controller updateItem', () => {
  let res: Response;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  const next: NextFunction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    res = { status: statusMock, json: jsonMock } as unknown as Response;
  });

  it('responde con mensaje de eliminado cuando el service devuelve null', async () => {
    (cartService.updateItem as jest.Mock).mockResolvedValue(null);
    const req = {
      user: { id: 'u1' },
      body: { quantity: 0 },
      params: { id: 'i1' },
    } as unknown as AuthedRequest;

    cartController.updateItem(req, res, next);
    await Promise.resolve();

    expect(cartService.updateItem).toHaveBeenCalledWith('u1', 'i1', 0);
    expect(jsonMock).toHaveBeenCalledWith({ message: 'Item eliminado del carrito' });
  });
});
