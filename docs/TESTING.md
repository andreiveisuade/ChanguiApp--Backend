# Testing Playbook — ChanguiApp Backend

Test runner: **Jest** + **Supertest**. Tests en `__tests__/`. Coverage objetivo: **100%**.

---

## Comandos

```bash
npm test                  # corre todos los tests
npm run test:watch        # watch mode (re-corre al guardar)
npm run test:coverage     # genera reporte de coverage
npm run test:unit         # solo tests unitarios
npm run test:integration  # solo tests de integración
```

---

## Estructura de archivos

```
__tests__/
  setup.js                     # env vars para tests (corre antes de todo)
  helpers/
    mockSupabase.js             # mock del cliente Supabase, reutilizable
    testData.js                 # fixtures: usuarios, productos, carritos, listas
  health.test.js                # test del endpoint /health
  unit/
    services/                   # tests unitarios de services (mockeando repositories)
    repositories/               # tests unitarios de repositories (mockeando supabase)
  integration/                  # tests de endpoints con supertest
```

---

## Flujo TDD — Paso a paso

```
1. Agarrás tu issue DEV-XXX en Jira → "In Progress"
2. Creás tu branch: feature/DEV-XXX-descripcion
3. Abrí una terminal con `npm run test:watch`
4. Creá el archivo de test en __tests__/ (copiá el patrón de abajo)
5. Escribí el test → va a fallar (rojo) — esto es esperado
6. Implementá el código mínimo en src/ para que pase
7. Test pasa (verde) → refactoreá si hace falta
8. Repetí 5-7 para cada caso (happy path, error, edge case)
9. Corré `npm run test:coverage` → verificá 100% en tus archivos nuevos
10. Commiteá, rebaseá contra dev, pusheá, abrí PR
```

---

## Patrón: Test unitario de un Service

Un service tiene lógica de negocio y usa un repository. En el test se mockea el repository.

**Ejemplo: `__tests__/unit/services/cart.service.test.js`**

```js
const cartService = require('../../../src/services/cart.service');
const cartRepository = require('../../../src/repositories/cart.repository');

// Mockeamos el repository completo
jest.mock('../../../src/repositories/cart.repository');

const { validCart, validCartItem, validProduct } = require('../../helpers/testData');

describe('CartService', () => {
  afterEach(() => jest.clearAllMocks());

  describe('getCart', () => {
    it('devuelve el carrito activo del usuario', async () => {
      cartRepository.findActiveByUserId.mockResolvedValue(validCart);

      const result = await cartService.getCart(validCart.user_id);

      expect(cartRepository.findActiveByUserId).toHaveBeenCalledWith(validCart.user_id);
      expect(result).toEqual(validCart);
    });

    it('lanza error si no hay carrito activo', async () => {
      cartRepository.findActiveByUserId.mockResolvedValue(null);

      await expect(cartService.getCart('user-inexistente'))
        .rejects.toThrow('No hay carrito activo');
    });
  });

  describe('addItem', () => {
    it('agrega un item al carrito', async () => {
      const newItem = { ...validCartItem, id: 'new-uuid' };
      cartRepository.addItem.mockResolvedValue(newItem);

      const result = await cartService.addItem(validCart.id, validProduct.id, 2);

      expect(cartRepository.addItem).toHaveBeenCalledWith(validCart.id, validProduct.id, 2);
      expect(result).toEqual(newItem);
    });
  });
});
```

**Qué muestra este ejemplo:**
- `jest.mock(...)` reemplaza el repository real por mocks automáticos
- Cada test setea el comportamiento del mock con `mockResolvedValue`
- Se verifica que el service llame al repository con los args correctos
- Se testea happy path + caso de error

---

## Patrón: Test de integración de un Endpoint

Un test de integración usa Supertest para hacer requests HTTP reales contra la app Express. Se mockean las dependencias externas (Supabase).

**Ejemplo: `__tests__/integration/cart.test.js`**

```js
const request = require('supertest');
const app = require('../../src/index');

// Mock de Supabase a nivel global
jest.mock('../../src/config/supabase', () => require('../helpers/mockSupabase'));

const mockSupabase = require('../helpers/mockSupabase');
const { validCart, validCartItem } = require('../helpers/testData');

describe('GET /api/cart', () => {
  it('devuelve el carrito del usuario autenticado', async () => {
    // Configurar qué devuelve Supabase
    mockSupabase.single.mockResolvedValue({
      data: { ...validCart, items: [validCartItem] },
      error: null,
    });

    const res = await request(app)
      .get('/api/cart')
      .set('Authorization', 'Bearer test-token');

    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(validCart.id);
    expect(res.body.items).toHaveLength(1);
  });

  it('devuelve 401 sin token', async () => {
    const res = await request(app).get('/api/cart');

    expect(res.statusCode).toBe(401);
  });
});
```

**Qué muestra este ejemplo:**
- `jest.mock(...)` reemplaza el Supabase real por el mock compartido
- Supertest hace requests HTTP contra `app` (sin levantar servidor)
- Se testea el flujo completo: request → middleware → controller → service → response
- Se verifica status code y body

---

## Patrón: Test de un Repository

Un repository habla con Supabase. En el test se mockea el cliente de Supabase.

**Ejemplo: `__tests__/unit/repositories/cart.repository.test.js`**

```js
jest.mock('../../../src/config/supabase', () => require('../../helpers/mockSupabase'));

const mockSupabase = require('../../helpers/mockSupabase');
const cartRepository = require('../../../src/repositories/cart.repository');
const { validCart } = require('../../helpers/testData');

describe('CartRepository', () => {
  afterEach(() => jest.clearAllMocks());

  describe('findActiveByUserId', () => {
    it('busca el carrito activo del usuario', async () => {
      mockSupabase.single.mockResolvedValue({ data: validCart, error: null });

      const result = await cartRepository.findActiveByUserId(validCart.user_id);

      expect(mockSupabase.from).toHaveBeenCalledWith('carts');
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', validCart.user_id);
      expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'active');
      expect(result).toEqual(validCart);
    });

    it('devuelve null si no hay carrito', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: null });

      const result = await cartRepository.findActiveByUserId('no-existe');

      expect(result).toBeNull();
    });
  });
});
```

---

## Qué testear y qué NO

### SI testear

- Lógica de negocio en **services** (validaciones, cálculos, flujos)
- Queries en **repositories** (que llamen a Supabase con los args correctos)
- **Endpoints** completos con Supertest (status codes, body, auth)
- **Middleware** custom (auth, error handler)
- Casos de error: qué pasa cuando Supabase devuelve error, cuando falta un campo, etc.

### NO testear

- Express en sí (ya lo testearon ellos)
- Supabase internals (el mock es suficiente)
- `src/config/supabase.js` (solo crea el client)
- `src/index.js` (solo monta rutas)
- Archivos de configuración

---

## Reglas del equipo

1. **Cada endpoint nuevo se entrega con su test** en la misma PR
2. **Test primero:** escribí el test antes del código cuando puedas
3. **Coverage 100%** en archivos nuevos de `src/`
4. **Usá los helpers compartidos:** `mockSupabase` y `testData` — no reinventes mocks
5. **Nombres descriptivos:** `'devuelve 401 sin token'` > `'test error'`
6. **Happy path + al menos 1 caso de error** por función/endpoint

---

*Documento mantenido por el equipo. Referencia rápida: copiá el patrón que necesites y adaptalo a tu caso.*
