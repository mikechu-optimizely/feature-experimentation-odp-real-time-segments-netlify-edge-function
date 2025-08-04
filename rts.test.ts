// Unit tests for RTS edge function
// @ts-ignore - External modules
import { assertEquals, assertExists, assertInstanceOf } from "https://deno.land/std@0.208.0/assert/mod.ts";
import rtsFunction from "./netlify/edge-functions/rts.ts";

declare const Deno: any;

const RTS_URL = "http://localhost:8000/api/rts";

// Mock context for Netlify edge functions
const mockContext = {
  site: { id: "test-site" },
  deploy: { id: "test-deploy" }
};

Deno.test("RTS function - missing userId should return 400", async () => {
  const request = new Request(RTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "",
      attributes: { country: "US" }
    })
  });

  const response = await rtsFunction(request, mockContext);

  assertEquals(response.status, 400);
  assertEquals(response.headers.get("Content-Type"), "application/json");

  const body = await response.json();
  assertEquals(body.success, false);
  assertExists(body.error);
  assertEquals(body.error, "userId is required");
});

Deno.test("RTS function - OPTIONS request should return CORS headers", async () => {
  const request = new Request(RTS_URL, {
    method: "OPTIONS"
  });

  const response = await rtsFunction(request, mockContext);

  assertEquals(response.status, 200);
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
  assertEquals(response.headers.get("Access-Control-Allow-Methods"), "GET, POST, OPTIONS");
  assertEquals(response.headers.get("Access-Control-Allow-Headers"), "Content-Type");
});

Deno.test("RTS function - GET request should return 405", async () => {
  const request = new Request(RTS_URL, {
    method: "GET"
  });

  const response = await rtsFunction(request, mockContext);

  assertEquals(response.status, 405);

  const body = await response.json();
  assertEquals(body.success, false);
  assertEquals(body.error, "Method not allowed. Use POST.");
});

Deno.test("RTS function - valid request structure with mock SDK key", async () => {
  const request = new Request(RTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "test-user-123",
      attributes: {
        country: "US",
        age: 25,
        plan: "premium"
      },
      flagKey: "test-flag"
    })
  });

  const response = await rtsFunction(request, mockContext);

  // Should be 500 due to invalid SDK key, but structure should be correct
  assertEquals(response.headers.get("Content-Type"), "application/json");

  const body = await response.json();
  assertExists(body.success);
  assertEquals(typeof body.success, "boolean");

  if (!body.success) {
    assertExists(body.error);
    assertExists(body.metadata);
    assertEquals(body.metadata.userId, "test-user-123"); // Should be the actual userId since request was parsed successfully
  }
});

Deno.test("RTS function - response structure validation", async () => {
  const request = new Request(RTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "test-user-456",
      attributes: { country: "CA" },
      flagKey: "test-flag"
    })
  });

  const response = await rtsFunction(request, mockContext);

  const body = await response.json();

  // Validate response structure regardless of success/failure
  assertExists(body.success);
  assertEquals(typeof body.success, "boolean");
  assertExists(body.metadata);
  assertExists(body.metadata.timestamp);

  if (body.success) {
    assertExists(body.qualifiedSegments);
    assertInstanceOf(body.qualifiedSegments, Array);
  } else {
    assertExists(body.error);
  }
});
