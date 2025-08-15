// Unit tests for RTS edge function
import {
  assertEquals,
  assertExists,
  assertInstanceOf,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import rtsFunction from "../netlify/edge-functions/rts.ts";

const RTS_URL = "http://localhost:8000/api/rts";

// Mock context for Netlify edge functions
const mockContext: unknown = {
  site: { id: "test-site" },
  deploy: { id: "test-deploy" },
};

Deno.test("RTS function - missing userId should return 400", async () => {
  const request = new Request(RTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "",
      attributes: { country: "US" },
    }),
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
    method: "OPTIONS",
  });

  const response = await rtsFunction(request, mockContext);

  assertEquals(response.status, 200);
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
  assertEquals(
    response.headers.get("Access-Control-Allow-Methods"),
    "GET, POST, OPTIONS",
  );
  assertEquals(
    response.headers.get("Access-Control-Allow-Headers"),
    "Content-Type",
  );
});

Deno.test("RTS function - GET request should return 405", async () => {
  const request = new Request(RTS_URL, {
    method: "GET",
  });

  const response = await rtsFunction(request, mockContext);

  assertEquals(response.status, 405);

  const body = await response.json();
  assertEquals(body.success, false);
  assertEquals(body.error, "Method not allowed. Use POST.");
});

Deno.test("RTS function - PUT request should return 405", async () => {
  const request = new Request(RTS_URL, {
    method: "PUT",
  });

  const response = await rtsFunction(request, mockContext);

  assertEquals(response.status, 405);

  const body = await response.json();
  assertEquals(body.success, false);
  assertEquals(body.error, "Method not allowed. Use POST.");
});

Deno.test("RTS function - DELETE request should return 405", async () => {
  const request = new Request(RTS_URL, {
    method: "DELETE",
  });

  const response = await rtsFunction(request, mockContext);

  assertEquals(response.status, 405);

  const body = await response.json();
  assertEquals(body.success, false);
  assertEquals(body.error, "Method not allowed. Use POST.");
});

Deno.test("RTS function - invalid JSON should return 400", async () => {
  const request = new Request(RTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "invalid json {",
  });

  const response = await rtsFunction(request, mockContext);

  assertEquals(response.status, 400);

  const body = await response.json();
  assertEquals(body.success, false);
  assertExists(body.error);
});

Deno.test("RTS function - missing SDK key should return 400", async () => {
  // Ensure SDK key is not set
  Deno.env.delete("OPTIMIZELY_SDK_KEY");

  const request = new Request(RTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "test-user",
      attributes: { country: "US" },
    }),
  });

  const response = await rtsFunction(request, mockContext);

  assertEquals(response.status, 400);

  const body = await response.json();
  assertEquals(body.success, false);
  assertExists(body.error);
  assertEquals(body.error, "SDK key is required (set OPTIMIZELY_SDK_KEY env var or include in request body)");
});

Deno.test("RTS function - valid request structure with mock SDK key", async () => {
  // Set a test SDK key for this test
  Deno.env.set("OPTIMIZELY_SDK_KEY", "test-sdk-key-12345678901234567890");

  const request = new Request(RTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "test-user-123",
      attributes: {
        country: "US",
        age: 25,
        plan: "premium",
      },
      flagKey: "test-flag",
    }),
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

  // Clean up
  Deno.env.delete("OPTIMIZELY_SDK_KEY");
});

Deno.test("RTS function - response structure validation", async () => {
  // Set a test SDK key for this test
  Deno.env.set("OPTIMIZELY_SDK_KEY", "test-sdk-key-12345678901234567890");

  const request = new Request(RTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "test-user-456",
      attributes: { country: "CA" },
      flagKey: "test-flag",
    }),
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

  // Clean up
  Deno.env.delete("OPTIMIZELY_SDK_KEY");
});

Deno.test("RTS function - null userId should return 400", async () => {
  const request = new Request(RTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: null,
      attributes: { country: "US" },
    }),
  });

  const response = await rtsFunction(request, mockContext);

  assertEquals(response.status, 400);
  assertEquals(response.headers.get("Content-Type"), "application/json");

  const body = await response.json();
  assertEquals(body.success, false);
  assertEquals(body.error, "userId is required");
});

Deno.test("RTS function - undefined userId should return 400", async () => {
  const request = new Request(RTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      attributes: { country: "US" },
      // userId is undefined
    }),
  });

  const response = await rtsFunction(request, mockContext);

  assertEquals(response.status, 400);
  assertEquals(response.headers.get("Content-Type"), "application/json");

  const body = await response.json();
  assertEquals(body.success, false);
  assertEquals(body.error, "userId is required");
});
