import { createReadStream, statSync } from "node:fs";
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

const server = createServer((request, response) => {
  try {
    const requestUrl = new URL(request.url || "/", `http://${host}:${port}`);
    const pathname = decodeURIComponent(requestUrl.pathname);
    const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    let filePath = resolve(projectRoot, normalize(relativePath));

    if (filePath !== projectRoot && !filePath.startsWith(`${projectRoot}${sep}`)) {
      response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Acceso denegado");
      return;
    }

    if (statSync(filePath).isDirectory()) filePath = join(filePath, "index.html");

    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Type": mimeTypes.get(extname(filePath).toLowerCase()) || "application/octet-stream",
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
