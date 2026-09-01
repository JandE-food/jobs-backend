import test from "node:test";
import assert from "node:assert/strict";

import { buildApp } from "../src/app.js";

test("GET /health returns OK", async () => {
  const app = buildApp({ initializeDb: false });

  const response = await app.inject({
    method: "GET",
    url: "/health",
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body, "OK");
  assert.equal(response.headers["content-type"], "text/plain; charset=utf-8");

  await app.close();
});
