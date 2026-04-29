# Diagrama de Secuencia — Scan & Go

Cubre el flujo completo de escaneo de productos y gestión del carrito, incluyendo el tachado automático de items de listas de compras activas.

```mermaid
sequenceDiagram
    actor U as Usuario
    participant App as App (React Native)
    participant Cam as Cámara / Scanner
    participant BE as Backend (Express)
    participant DB as Supabase DB

    U->>App: Selecciona supermercado
    App->>BE: GET /api/stores
    BE->>DB: SELECT * FROM stores
    DB-->>BE: Lista de supermercados
    BE-->>App: 200 { stores[] }
    App-->>U: Muestra lista, usuario elige

    U->>App: Toca "Escanear producto"
    App->>Cam: Activa cámara
    Cam-->>App: Código de barras detectado

    App->>BE: GET /api/products/barcode/:code
    BE->>DB: SELECT * FROM products WHERE barcode = code
    DB-->>BE: Producto con precio
    alt Producto encontrado
        BE-->>App: 200 { product }
        App-->>U: Muestra nombre, precio y botón "Agregar"
        U->>App: Confirma agregar al carrito
        App->>BE: POST /api/cart/items { product_id, quantity }
        BE->>DB: INSERT INTO cart_items
        Note over BE,DB: Si el producto está en una lista activa,<br/>UPDATE list_items SET purchased = true
        DB-->>BE: Item insertado
        BE-->>App: 201 { cart_item, list_item_updated? }
        App-->>U: Actualiza total acumulado en pantalla
    else Producto no encontrado
        BE-->>App: 404 { error: "Producto no encontrado" }
        App-->>U: Muestra mensaje de error
    end

    U->>App: Escanea más productos (repite flujo)
    U->>App: Toca "Ver carrito"
    App->>BE: GET /api/cart
    BE->>DB: SELECT cart_items JOIN products WHERE cart_id = activo
    DB-->>BE: Items con subtotales
    BE-->>App: 200 { items[], total }
    App-->>U: Muestra carrito con total acumulado
```

## Actores y sistemas

| Participante | Descripción |
|---|---|
| Usuario | Persona que usa la app dentro del supermercado |
| App (React Native) | Cliente móvil (Android / iOS) |
| Cámara / Scanner | Sensor de cámara del dispositivo para lectura de barcode |
| Backend (Express) | Servidor Node.js desplegado en Render |
| Supabase DB | Base de datos PostgreSQL en Supabase (catálogo sincronizado desde Precios Claros) |

## Endpoints involucrados

- `GET /api/stores`
- `GET /api/products/barcode/:code`
- `POST /api/cart/items`
- `GET /api/cart`
