import { createReadStream, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const host = "127.0.0.1";
const portFlagIndex = process.argv.indexOf("--port");
const requestedPort = portFlagIndex >= 0 ? process.argv[portFlagIndex + 1] : process.env.PORT;
const port = Number.parseInt(requestedPort || "4173", 10);
const shouldOpen = process.argv.includes("--open");

const visualReviewSession = {
  id: "visual-review-s4",
  token: "visual-review-token",
  code: "REVIEW4",
  introPhase: "game",
};

const visualReviewState = {
  session_id: visualReviewSession.id,
  participant_code: visualReviewSession.code,
  application_name: "Revisión visual",
  sequence: 1,
  is_primary: false,
  status: "in_progress",
  current_scene: 3,
  current_step: 0,
  completed_scenes: [0, 1, 2],
  metrics: null,
};

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error("El puerto debe ser un número entre 1 y 65535.");
  process.exit(1);
}

const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
]);

const openBrowser = (url) => {
  const commands = {
    darwin: ["open", [url]],
    linux: ["xdg-open", [url]],
    win32: ["cmd", ["/c", "start", "", url]],
  };
  const command = commands[process.platform];
  if (!command) return;

  const child = spawn(command[0], command[1], {
    detached: true,
    stdio: "ignore",
  });
  child.unref();
};

const sendJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
};

const visualReviewBootstrap = () => `
    <script>
      localStorage.setItem(
        "tadeo-research-session-v1",
        ${JSON.stringify(JSON.stringify(visualReviewSession))}
      );
    </script>`;

const server = createServer((request, response) => {
  try {
    const requestUrl = new URL(request.url || "/", `http://${host}:${port}`);
    const isVisualReview = requestUrl.searchParams.get("testSession") === "visual-review";

    if (requestUrl.pathname === `/api/sessions/${visualReviewSession.id}/state`) {
      sendJson(response, 200, { state: visualReviewState });
      return;
    }

    if (requestUrl.pathname === `/api/sessions/${visualReviewSession.id}/activity`) {
      sendJson(response, 200, { recorded: true });
      return;
    }

    const pathname = decodeURIComponent(requestUrl.pathname);
    const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    let filePath = resolve(projectRoot, normalize(relativePath));

    if (filePath !== projectRoot && !filePath.startsWith(`${projectRoot}${sep}`)) {
      response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Acceso denegado");
      return;
    }

    if (statSync(filePath).isDirectory()) filePath = join(filePath, "index.html");

    const contentType = mimeTypes.get(extname(filePath).toLowerCase()) || "application/octet-stream";

    if (isVisualReview && filePath === resolve(projectRoot, "index.html")) {
      const html = readFileSync(filePath, "utf8").replace(
        '<script type="module" src="./js/app.js"></script>',
        `${visualReviewBootstrap()}\n    <script type="module" src="./js/app.js"></script>`,
      );
      response.writeHead(200, {
        "Cache-Control": "no-store",
        "Content-Type": contentType,
      });
      response.end(html);
      return;
    }

    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Type": contentType,
    });

    createReadStream(filePath).on("error", () => {
      if (!response.headersSent) response.writeHead(500);
      response.end("No se pudo leer el archivo");
    }).pipe(response);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Archivo no encontrado");
  }
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`El puerto ${port} ya está ocupado. Prueba: npm run dev -- --port 4174`);
  } else {
    console.error("No se pudo iniciar el servidor:", error.message);
  }
  process.exit(1);
});

server.listen(port, host, () => {
  const url = `http://${host}:${port}`;
  console.log("\n  El día de Tadeo está listo");
  console.log(`  ${url}`);
  console.log("  Presiona Ctrl+C para detenerlo.\n");
  if (shouldOpen) openBrowser(url);
});

const stopServer = () => server.close(() => process.exit(0));
process.on("SIGINT", stopServer);
process.on("SIGTERM", stopServer);
