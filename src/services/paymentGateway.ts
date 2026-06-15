// Puerto de pagos (DIP). La lógica de checkout —alto nivel— depende de esta
// abstracción, no del SDK concreto de Mercado Pago. La interfaz la declara el
// consumidor (checkout.service): describe lo que el service necesita, en
// términos de dominio, sin filtrar la forma del SDK. El adapter sobre el SDK
// vive en config/mercadopago.ts; un fake la sustituye en los tests sin red.
// Mismo patrón que PurchaseRepository en purchase.service.

export interface PaymentPreferenceItem {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  currency_id: string;
}

export interface CreatePreferenceInput {
  items: PaymentPreferenceItem[];
  externalReference: string;
  notificationUrl: string;
  backUrl: string;
}

export interface PaymentPreference {
  id: string | undefined;
  init_point: string | undefined;
}

export interface PaymentInfo {
  id: string | number;
  status: string;
  external_reference?: string;
}

export interface PaymentGateway {
  // Tags de la cuenta dueña del token (para exigir credenciales de prueba).
  getAccountTags(): Promise<string[]>;
  // Crea una preferencia de pago y devuelve su id y punto de inicio.
  createPreference(input: CreatePreferenceInput): Promise<PaymentPreference>;
  // Consulta un pago por id; null si no existe.
  getPayment(id: string): Promise<PaymentInfo | null>;
}
