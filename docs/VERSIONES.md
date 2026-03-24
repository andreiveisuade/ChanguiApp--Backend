# Versiones Mínimas Soportadas — ChanguiApp

## Android

### Decisión
**API Level mínimo: 26 (Android 8.0 Oreo)**

### Justificación

La distribución global de versiones Android a marzo 2026 muestra que Android 11, 12, 13, 14 y 15 concentran la gran mayoría de dispositivos activos. Android 8.0 (API 26) como mínimo permite cubrir prácticamente el 100% del mercado relevante.

En Argentina, el parque de dispositivos Android tiene un ciclo de vida más largo que en mercados como EE.UU. — los usuarios mantienen equipos más tiempo, lo que hace que versiones como Android 8/9 aún tengan presencia significativa. Bajar el mínimo a API 26 en lugar de API 28 o 29 amplía esa cobertura sin costo técnico relevante para el proyecto.

**Factores técnicos que respaldan API 26:**
- React Native 0.73+ soporta API 23 como mínimo absoluto, por lo que API 26 es una decisión conservadora y segura
- La cámara para escaneo de barcode (requisito core de ChanguiApp) está plenamente soportada desde API 21
- Mercado Pago SDK para Android requiere API 21 como mínimo
- Supabase JS client no tiene restricción de API Level

**Cobertura estimada:** ~98% de dispositivos Android activos en Argentina

---

## iOS

### Decisión
**Versión mínima: iOS 15.1**

### Justificación

React Native 0.76 (versión estable actual) establece **iOS 15.1 como mínimo oficial** del framework. Esta restricción viene impuesta por el propio RN y no es negociable si se quiere usar la versión estable del framework.

Desde el lado del mercado, Apple publica que iOS 18 corre en el 82% de todos los iPhones activos, y las versiones anteriores a iOS 15 representan menos del 2% del parque total. La adopción de nuevas versiones de iOS en Argentina sigue el patrón global dado que los iPhones reciben actualizaciones de manera uniforme.

**Factores técnicos que respaldan iOS 15.1:**
- Requisito mínimo de React Native 0.76+
- Supabase JS client soporta iOS 13+, por lo que no hay conflicto
- Mercado Pago SDK iOS soporta iOS 13+
- La cámara para escaneo de barcode está disponible desde iOS 7

**Cobertura estimada:** ~98% de dispositivos iPhone activos en Argentina

---

## Configuración en el proyecto

### Android — `android/build.gradle`
```gradle
android {
    compileSdkVersion 35
    defaultConfig {
        minSdkVersion 26        // Android 8.0 Oreo
        targetSdkVersion 35     // Android 15
    }
}
```

### iOS — `ios/Podfile`
```ruby
platform :ios, '15.1'
```

---


*Fuentes: React Native versioning policy, Google Android distribution (dic 2025), Apple iOS adoption data (jun 2025)*