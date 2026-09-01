---
tags:
  - desarrollo
  - arquitectura
  - scaffold
estado: implementado
---

# Scaffold técnico

[[Bienvenido|← Volver al inicio]]

## Estructura web

```text
videojuego-tadeo/
├── index.html
├── dev.command
├── package.json
├── scripts/
│   └── dev-server.mjs
├── css/
│   └── main.css
├── js/
│   └── app.js
└── assets/
    ├── scenes/
    ├── characters/
    └── objects/
```

## Arquitectura de la experiencia

```text
Inicio
  ↓
Agenda inicial
  ↓
Situación 1 → descubrimiento: igualdad
  ↓
Situación 2 → completa “Alimentar al perro” → incógnita
  ↓
Situación 3 → completa “Papelería” → ecuación
  ↓
Situación 4 → completa “Regalo” → modelación Ax-B=C
  ↓
Situación 5 → completa “Cena” → incógnita en ambos miembros
  ↓
Día completado
```

## Estado de juego

El prototipo guarda localmente:

- Si la historia ya comenzó.
- La situación actual.
- Las situaciones completadas.
- Las tarjetas de descubrimiento desbloqueadas.

No utiliza cuenta, base de datos ni conexión externa. El botón **Jugar de nuevo** borra ese progreso local.

## Entorno de desarrollo

- **Doble clic en macOS:** `dev.command` inicia el servidor y abre el navegador.
- **Terminal:** `npm run dev` realiza la misma operación.
- **Sin abrir navegador:** `npm run dev:server`.
- **Puerto alternativo:** `npm run dev -- --port 4174`.
- No requiere `npm install` ni paquetes de terceros.

Docker no se incorpora en esta etapa porque la aplicación es completamente estática. Se reconsiderará si se añade un backend, persistencia remota, emuladores o un proceso de despliegue basado en contenedores.

## Componentes implementados

- Barra superior con tiempo ficticio, agenda y descubrimientos.
- Indicador de progreso.
- Escenario estático y sprite por situación.
- Formularios con validación contextual, pistas y reintentos sin penalización.
- Agenda con cuatro estados de finalización.
- Cinco tarjetas de descubrimiento.
- Pantalla de cierre y reinicio.
- Diseño responsivo y soporte de teclado.

## Criterios para la siguiente iteración

- Descomponer cada situación en más pantallas para reflejar todas las preguntas de las hojas de trabajo.
- Añadir diálogos por personaje antes y después de cada reto.
- Incorporar audio, si la intervención didáctica lo requiere.
- Registrar respuestas y explicaciones solo si la investigación define un protocolo de privacidad y almacenamiento.
