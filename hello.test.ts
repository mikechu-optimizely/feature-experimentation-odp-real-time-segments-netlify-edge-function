// Unit tests for hello edge function
// @ts-ignore - External module from deno.land
import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";
import helloFunction from "./netlify/edge-functions/hello.ts";

declare const Deno: any;

Deno.test("Hello function - GET request", async () => {
  // Create a mock request
  const request = new Request("http://localhost:8000/api/hello", {
    method: "GET",
  });

  // Create a mock context (Netlify provides this in production)
  const context = {
    site: { id: "test-site" },
    deploy: { id: "test-deploy" }
  };

  // Call our function
  const response = await helloFunction(request, context);

  // Assertions
  assertEquals(response.status, 200);
  assertEquals(response.headers.get("Content-Type"), "application/json");
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
  
  const body = await response.json();
  assertEquals(body.message, "hello world");
});

Deno.test("Hello function - OPTIONS request (CORS)", async () => {
  const request = new Request("http://localhost:8000/api/hello", {
    method: "OPTIONS",
  });

  const context = {
    site: { id: "test-site" },
    deploy: { id: "test-deploy" }
  };

  const response = await helloFunction(request, context);

  // Should still return the same response for this simple function
  assertEquals(response.status, 200);
  assertExists(response.headers.get("Access-Control-Allow-Origin"));
});

Deno.test("Hello function - POST request", async () => {
  const request = new Request("http://localhost:8000/api/hello", {
    method: "POST",
    body: JSON.stringify({ test: "data" }),
    headers: { "Content-Type": "application/json" }
  });

  const context = {
    site: { id: "test-site" },
    deploy: { id: "test-deploy" }
  };

  const response = await helloFunction(request, context);

  assertEquals(response.status, 200);
  const body = await response.json();
  assertEquals(body.message, "hello world");
});
