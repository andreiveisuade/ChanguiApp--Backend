# Diagrama de Secuencia — Discriminación de IVA

Cubre cómo se asigna la categoría fiscal a cada producto (durante el sync) y cómo
se calcula el desglose de IVA al consultar un producto o el carrito.

Precios Claros entrega el **precio final con IVA incluido** (Ley 27.221) y no
expone la alícuota. La categoría fiscal se infiere por keywords sobre el nombre,
con fundamento en la **Ley 23.349 (Ley del IVA)**.

```mermaid
sequenceDiagram
    participant Cron as Cron (GitHub Actions)
    participant BE as Backend (Express)
    participant PC as Precios Claros (SEPA)
    participant DB as Supabase DB
    actor U as Usuario
    participant App as App (React Native)

    Note over Cron,DB: Sincronización nocturna + clasificación fiscal
    Cron->>BE: POST /api/admin/sync-precios-claros
    BE->>PC: GET /productos (paginado)
    PC-->>BE: Productos (precio final con IVA)
    BE->>DB: upsert products (sin tocar categoría)
    BE->>DB: SELECT tax_categories
    Note over BE: classifyProduct(name): match por<br/>keywords (Ley 23.349) → categoría;<br/>sin match → general (21%)
    BE->>DB: UPDATE products SET tax_category_id<br/>WHERE tax_locked = false

    Note over U,DB: Consulta en runtime (cálculo del desglose)
    U->>App: Escanea un producto
    App->>BE: GET /api/products/barcode/:code
    BE->>DB: SELECT product + tax_category (rate)
    DB-->>BE: price final + alícuota
    Note over BE: net = price / (1 + rate/100)<br/>iva = price - net
    BE-->>App: 200 { price, tax: { rate, net_price, tax_amount } }
    App-->>U: Precio sin IVA / IVA (rate) / Precio final

    Note over U,DB: Carrito con alícuotas mixtas
    U->>App: Ver carrito
    App->>BE: GET /api/cart
    BE->>DB: SELECT cart_items + product + tax_category
    Note over BE: summarizeByRate: agrupa IVA por alícuota
    BE-->>App: 200 { items, total, summary: { subtotal_net, taxes[], total } }
    App-->>U: Desglose por alícuota (21% / 10,5% / 0%)
```

## Reglas clave

| Regla | Detalle |
|---|---|
| Fuente fiscal | Ley 23.349 art. 28 (10,5%) y art. 7 (exenciones). Codificada en `tax_categories` |
| Clasificación | Heurística por keywords sobre `products.name`, en el sync (no en cada request) |
| Fallback | Sin coincidencia → categoría `general` (21%), criterio conservador |
| Override | `POST /api/admin/products/:barcode/tax-category` fija categoría y bloquea (`tax_locked`) |
| Desglose vivo | Producto y carrito: se calcula en runtime con la categoría vigente |
| Desglose congelado | Compra: usa `purchase_items.tax_rate` snapshot (comprobante inmutable) |

## Limitaciones conocidas y roadmap

- La heurística por keywords es aproximada; casos borde se corrigen con el override manual.
- En una versión productiva se complementaría con enriquecimiento de datos
  (OpenFoodFacts) o clasificación a código NCM (nomenclador AFIP) — **no implementado**.

## Endpoints involucrados

- `POST /api/admin/sync-precios-claros`
- `POST /api/admin/reclassify`
- `POST /api/admin/products/:barcode/tax-category`
- `GET /api/products/barcode/:code`
- `GET /api/cart`
- `GET /api/purchases/:id`
