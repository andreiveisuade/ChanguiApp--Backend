// Schemas OpenAPI reutilizables (components.schemas). Separados de swagger.ts
// para que el armado del spec quede legible. Mantener en sync con
// src/types/domain.ts (ver tests y la nota de drift en el README).
export const schemas = {
  Error: {
    type: 'object',
    properties: { error: { type: 'string' } },
  },
  User: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      email: { type: 'string', format: 'email' },
      full_name: { type: 'string' },
      avatar_url: { type: 'string', nullable: true },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
    },
  },
  UserUpdate: {
    type: 'object',
    properties: {
      full_name: { type: 'string' },
      avatar_url: { type: 'string' },
    },
  },
  Product: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      barcode: { type: 'string', example: '7790895000782' },
      name: { type: 'string' },
      brand: { type: 'string', nullable: true },
      price: { type: 'number', format: 'float', description: 'Precio final con IVA incluido' },
      image_url: { type: 'string', nullable: true },
      tax_category_id: { type: 'string', example: 'leche' },
      tax_locked: { type: 'boolean', description: 'Override manual: el sync no lo reclasifica' },
      tax_category: {
        type: 'object',
        nullable: true,
        description: 'Categoría fiscal embebida (id, nombre, alícuota)',
        properties: {
          id: { type: 'string', example: 'leche' },
          name: { type: 'string', example: 'Leche fluida' },
          rate: { type: 'number', example: 0 },
        },
      },
      tax: {
        type: 'object',
        description: 'Desglose calculado en runtime según la alícuota de la categoría',
        properties: {
          category: { type: 'string', example: 'Leche fluida' },
          rate: { type: 'number', example: 0 },
          net_price: {
            type: 'number',
            example: 850,
            description: 'Precio sin IVA (base imponible)',
          },
          tax_amount: { type: 'number', example: 0 },
        },
      },
    },
  },
  TaxSummary: {
    type: 'object',
    description: 'Desglose de IVA agrupado por alícuota (carrito o ticket)',
    properties: {
      subtotal_net: { type: 'number' },
      total: { type: 'number' },
      taxes: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            rate: { type: 'number', example: 21 },
            label: { type: 'string', example: 'IVA 21%' },
            base: { type: 'number' },
            amount: { type: 'number' },
          },
        },
      },
    },
  },
  CartItem: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      cart_id: { type: 'string', format: 'uuid' },
      product_id: { type: 'string', format: 'uuid' },
      quantity: { type: 'integer' },
      unit_price: { type: 'number' },
    },
  },
  Cart: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      user_id: { type: 'string', format: 'uuid' },
      status: {
        type: 'string',
        enum: ['active', 'closed', 'cancelled'],
      },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
      mp_preference_id: { type: 'string', nullable: true },
      items: {
        type: 'array',
        items: { $ref: '#/components/schemas/CartItem' },
      },
    },
  },
  CheckoutResponse: {
    type: 'object',
    properties: {
      preference_id: { type: 'string' },
      init_point: { type: 'string', format: 'uri' },
    },
  },
  Purchase: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      total: { type: 'number' },
      payment_id: { type: 'string' },
      payment_status: {
        type: 'string',
        enum: ['pending', 'completed', 'failed'],
      },
      created_at: { type: 'string', format: 'date-time' },
      mp_preference_id: { type: 'string', nullable: true },
    },
  },
  PurchaseItem: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      purchase_id: { type: 'string', format: 'uuid' },
      product_name: { type: 'string' },
      barcode: { type: 'string' },
      quantity: { type: 'integer' },
      unit_price: { type: 'number' },
      tax_rate: { type: 'number', description: 'Alícuota de IVA aplicada (%)' },
    },
  },
  PurchaseDetail: {
    allOf: [
      { $ref: '#/components/schemas/Purchase' },
      {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/PurchaseItem' },
          },
        },
      },
    ],
  },
  SyncAccepted: {
    type: 'object',
    properties: {
      sync_id: { type: 'string', format: 'uuid' },
    },
  },
  SyncJob: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      type: { type: 'string', example: 'precios_claros' },
      status: {
        type: 'string',
        enum: ['queued', 'running', 'completed', 'failed', 'partial'],
      },
      total_target: { type: 'integer', nullable: true },
      processed: { type: 'integer' },
      errors: { type: 'integer' },
      last_offset: { type: 'integer' },
      error_message: { type: 'string', nullable: true },
      started_at: { type: 'string', format: 'date-time' },
      completed_at: { type: 'string', format: 'date-time', nullable: true },
      created_at: { type: 'string', format: 'date-time' },
    },
  },
};
