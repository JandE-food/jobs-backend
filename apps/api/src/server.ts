import { buildApp } from "./app.js";

const host = process.env.HOST ?? "0.0.0.0";
const port = Number(process.env.PORT ?? 3001);

async function start() {
  const app = buildApp();

  try {
    await app.listen({ host, port });
    app.log.info(`API running on http://${host}:${port}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void start();
