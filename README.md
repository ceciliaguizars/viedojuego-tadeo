# El día de Tadeo

Prototipo web sin dependencias y bóveda de Obsidian para un videojuego educativo sobre ecuaciones de primer grado.

## Dev launcher

En macOS, haz doble clic en `dev.command`. El launcher inicia el servidor y abre el videojuego automáticamente en el navegador.

Desde terminal también puedes usar:

```bash
npm run dev
```

No es necesario ejecutar `npm install`: el servidor utiliza únicamente Node.js y no tiene dependencias externas.

Para iniciar el servidor sin abrir el navegador:

```bash
npm run dev:server
```

Para utilizar otro puerto:

```bash
npm run dev -- --port 4174
```

## Alternativa con Python

Desde esta carpeta:

```bash
python3 -m http.server 4173
```

Después abre `http://localhost:4173`.

## ¿Conviene Docker?

No para esta primera versión. El proyecto es una aplicación estática sin compilación, backend ni dependencias; el launcher ofrece el mismo entorno de desarrollo con menos pasos.

Docker sería conveniente cuando el proyecto incorpore un backend, una base de datos o emuladores, necesite una versión exacta de Node.js en todo el equipo, o se despliegue mediante una infraestructura basada en contenedores.

## Contenido

- `index.html`, `css/main.css` y `js/app.js`: experiencia interactiva completa de inicio a cierre.
- `assets/`: escenarios, personajes y objetos del paquete visual proporcionado.
- `tadeo_videojuego/`: bóveda de Obsidian con narrativa, brief, situaciones y arquitectura.

No se requiere compilación, cuenta o base de datos. El progreso se conserva únicamente en `localStorage` del navegador.
