# Diagrama de Secuencia — Autenticación / Login

Cubre los dos flujos de autenticación de ChanguiApp: email/contraseña y Google Sign-In, ambos a través de Supabase Auth.

```mermaid
sequenceDiagram
    actor U as Usuario
    participant App as App (React Native)
    participant BE as Backend (Express)
    participant SA as Supabase Auth
    participant DB as Supabase DB

    U->>App: Ingresa email y contraseña
    App->>BE: POST /api/auth/login
    BE->>SA: signInWithPassword(email, password)
    SA-->>BE: { session, user } | error
    alt Credenciales válidas
        BE->>DB: SELECT * FROM users WHERE id = user.id
        DB-->>BE: Perfil del usuario
        BE-->>App: 200 { token, user }
        App-->>U: Redirige a Home
    else Credenciales inválidas
        BE-->>App: 401 { error: "Credenciales incorrectas" }
        App-->>U: Muestra mensaje de error
    end

    Note over App,SA: Flujo alternativo: Google Sign-In
    U->>App: Toca "Continuar con Google"
    App->>SA: signInWithOAuth(provider: google)
    SA-->>App: Redirige a Google OAuth
    U->>SA: Autoriza acceso en Google
    SA-->>App: { session, user }
    App->>BE: POST /api/auth/login (token Google)
    BE->>DB: UPSERT users (id, email, nombre)
    DB-->>BE: Perfil actualizado
    BE-->>App: 200 { token, user }
    App-->>U: Redirige a Home
```

## Actores y sistemas

| Participante | Descripción |
|---|---|
| Usuario | Persona que usa la app |
| App (React Native) | Cliente móvil (Android / iOS) |
| Backend (Express) | Servidor Node.js desplegado en Render |
| Supabase Auth | Servicio de autenticación de Supabase |
| Supabase DB | Base de datos PostgreSQL en Supabase |

## Endpoints involucrados

- `POST /api/auth/login`
