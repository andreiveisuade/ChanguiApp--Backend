# Diagrama de Secuencia — Checkout y Pago

Cubre el flujo de pago in-app mediante Mercado Pago (modo sandbox), incluyendo los tres estados posibles del webhook: aprobado, rechazado y pendiente.

```mermaid
sequenceDiagram
    actor U as Usuario
    participant App as App (React Native)
    participant BE as Backend (Express)
    participant MP as Mercado Pago SDK
    participant DB as Supabase DB

    U->>App: Toca "Pagar"
    App->>BE: POST /api/checkout { cart_id }
    BE->>DB: SELECT cart_items WHERE cart_id = activo
    DB-->>BE: Items y total
    BE->>MP: createPreference({ items[], total, back_urls, notification_url })
    MP-->>BE: { preference_id, init_point }
    BE->>DB: INSERT INTO purchases (status: pending)
    DB-->>BE: purchase_id
    BE-->>App: 200 { preference_id, checkout_url, purchase_id }

    App-->>U: Abre checkout de Mercado Pago in-app
    U->>MP: Ingresa datos de pago (tarjeta de prueba)
    MP-->>U: Procesa pago

    alt Pago aprobado
        MP->>BE: POST /api/checkout/webhook { payment_id, status: approved }
        BE->>MP: Verifica autenticidad del webhook
        MP-->>BE: Confirma pago válido
        BE->>DB: UPDATE purchases SET status = completed WHERE id = purchase_id
        BE->>DB: UPDATE carts SET status = closed WHERE id = cart_id
        DB-->>BE: OK
        BE-->>MP: 200 OK
        App-->>U: Pantalla de "Pago exitoso" con comprobante
    else Pago rechazado
        MP->>BE: POST /api/checkout/webhook { payment_id, status: rejected }
        BE->>DB: UPDATE purchases SET status = failed
        DB-->>BE: OK
        BE-->>MP: 200 OK
        App-->>U: Pantalla de "Pago rechazado", puede reintentar
    else Pago pendiente
        MP->>BE: POST /api/checkout/webhook { payment_id, status: pending }
        BE->>DB: UPDATE purchases SET status = pending
        DB-->>BE: OK
        BE-->>MP: 200 OK
        App-->>U: Pantalla de "Pago en proceso"
    end
```

## Actores y sistemas

| Participante | Descripción |
|---|---|
| Usuario | Persona que usa la app |
| App (React Native) | Cliente móvil (Android / iOS) |
| Backend (Express) | Servidor Node.js desplegado en Render |
| Mercado Pago SDK | Pasarela de pagos (modo sandbox/test) |
| Supabase DB | Base de datos PostgreSQL en Supabase |

## Endpoints involucrados

- `POST /api/checkout`
- `POST /api/checkout/webhook`
