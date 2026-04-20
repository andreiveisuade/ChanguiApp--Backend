declare module 'mercadopago' {
  export function configure(options: { access_token: string }): void;

  export interface PreferenceCreateResponse {
    body: {
      preference_id: string;
      init_point: string;
      [key: string]: unknown;
    };
  }

  export interface PaymentFindByIdResponse {
    body: {
      id: string | number;
      status: 'approved' | 'rejected' | 'pending' | string;
      external_reference?: string;
      preference_id?: string;
      transaction_amount?: number;
      [key: string]: unknown;
    };
  }

  export const preferences: {
    create: (preference: Record<string, unknown>) => Promise<PreferenceCreateResponse>;
  };

  export const payment: {
    findById: (id: string | number) => Promise<PaymentFindByIdResponse>;
  };
}
