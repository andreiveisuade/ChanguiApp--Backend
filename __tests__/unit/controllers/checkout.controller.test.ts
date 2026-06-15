export {};

jest.mock('../../../src/services/checkout.service', () => ({
  __esModule: true,
  checkoutService: {
    createPreference: jest.fn(),
    getCheckoutStatus: jest.fn(),
    handleWebhook: jest.fn(),
  },
}));

const checkoutController = require('../../../src/controllers/checkout.controller');
const { checkoutService } = require('../../../src/services/checkout.service');

// req fake: la firma se bypassa porque MP_WEBHOOK_SECRET está ausente y
// NODE_ENV='test' (no production). verifyMpSignature usa req.header y req.query.
const makeReq = () => ({
  header: jest.fn().mockReturnValue(undefined),
  query: {},
  body: { type: 'payment', data: { id: '123' } },
});

const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('checkout.controller webhook', () => {
  afterEach(() => jest.clearAllMocks());

  beforeEach(() => {
    delete process.env.MP_WEBHOOK_SECRET;
  });

  it('responde 200 {received:true} y loguea cuando handleWebhook lanza', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    checkoutService.handleWebhook.mockRejectedValue(new Error('x'));

    const req = makeReq();
    const res = makeRes();

    await checkoutController.webhook(req, res);

    expect(checkoutService.handleWebhook).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ received: true });
    expect(errSpy).toHaveBeenCalled();

    errSpy.mockRestore();
  });
});
