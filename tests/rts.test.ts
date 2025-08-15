// Unit tests for RTS edge function
import {
  assertEquals,
  assertExists,
  assertInstanceOf,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import rtsFunction from "../netlify/edge-functions/rts.ts";

import { OptimizelyClientManager } from "../src/OptimizelyClient.ts";
import { RTSService } from "../src/RTSService.ts";
import { RequestValidator } from "../src/RequestValidator.ts";
import { ResponseHelper } from "../src/ResponseHelper.ts";

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
  assertEquals(
    body.error,
    "SDK key is required (set OPTIMIZELY_SDK_KEY env var or include in request body)",
  );
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

Deno.test("RTS function - PATCH request should return 405", async () => {
  const request = new Request(RTS_URL, {
    method: "PATCH",
  });

  const response = await rtsFunction(request, mockContext);

  assertEquals(response.status, 405);

  const body = await response.json();
  assertEquals(body.success, false);
  assertEquals(body.error, "Method not allowed. Use POST.");
});

Deno.test("RTS function - HEAD request should return 405", async () => {
  const request = new Request(RTS_URL, {
    method: "HEAD",
  });

  const response = await rtsFunction(request, mockContext);

  assertEquals(response.status, 405);

  const body = await response.json();
  assertEquals(body.success, false);
  assertEquals(body.error, "Method not allowed. Use POST.");
});

Deno.test("RTS function - request with invalid content type", async () => {
  const request = new Request(RTS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
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
});

Deno.test("RTS function - empty request body", async () => {
  const request = new Request(RTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "",
  });

  const response = await rtsFunction(request, mockContext);

  assertEquals(response.status, 400);

  const body = await response.json();
  assertEquals(body.success, false);
  assertExists(body.error);
});

Deno.test("RTS function - malformed JSON with unexpected EOF", async () => {
  const request = new Request(RTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: '{"userId": "test"',
  });

  const response = await rtsFunction(request, mockContext);

  assertEquals(response.status, 400);

  const body = await response.json();
  assertEquals(body.success, false);
  assertExists(body.error);
});

Deno.test("RTS function - request without attributes", async () => {
  // Set a test SDK key for this test
  Deno.env.set("OPTIMIZELY_SDK_KEY", "test-sdk-key-12345678901234567890");

  const request = new Request(RTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "test-user-no-attrs",
    }),
  });

  const response = await rtsFunction(request, mockContext);

  // Should get a 500 due to invalid SDK key but structure should be correct
  assertEquals(response.headers.get("Content-Type"), "application/json");

  const body = await response.json();
  assertExists(body.success);
  assertEquals(typeof body.success, "boolean");

  if (!body.success) {
    assertExists(body.error);
    assertExists(body.metadata);
    assertEquals(body.metadata.userId, "test-user-no-attrs");
    assertEquals(body.metadata.attributes, {});
  }

  // Clean up
  Deno.env.delete("OPTIMIZELY_SDK_KEY");
});

Deno.test("RTS function - request with complex attributes", async () => {
  // Set a test SDK key for this test
  Deno.env.set("OPTIMIZELY_SDK_KEY", "test-sdk-key-12345678901234567890");

  const request = new Request(RTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "test-user-complex",
      attributes: {
        country: "US",
        age: 25,
        plan: "premium",
        preferences: {
          theme: "dark",
          notifications: true,
        },
        tags: ["vip", "beta-user"],
        timestamp: "2025-08-15T12:00:00Z",
      },
    }),
  });

  const response = await rtsFunction(request, mockContext);

  assertEquals(response.headers.get("Content-Type"), "application/json");

  const body = await response.json();
  assertExists(body.success);
  assertEquals(typeof body.success, "boolean");
  assertExists(body.metadata);

  if (!body.success) {
    assertEquals(body.metadata.userId, "test-user-complex");
    assertEquals(body.metadata.attributes.country, "US");
    assertEquals(body.metadata.attributes.age, 25);
  }

  // Clean up
  Deno.env.delete("OPTIMIZELY_SDK_KEY");
});

// Simulate userContext creation failure
Deno.test("RTS function - userContext creation failure returns 500", async () => {
  Deno.env.set("OPTIMIZELY_SDK_KEY", "test-sdk-key-12345678901234567890");
  // Patch OptimizelyClientManager to throw on createUserContext
  const original = OptimizelyClientManager.prototype.initialize;
  OptimizelyClientManager.prototype.initialize = function () {
    return Promise.resolve({
      createUserContext: () => null,
    });
  };
  const request = new Request(RTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: "fail-user", attributes: {} }),
  });
  const response = await rtsFunction(request, mockContext);
  assertEquals(response.status, 500);
  const body = await response.json();
  assertEquals(body.success, false);
  assertExists(body.error);
  OptimizelyClientManager.prototype.initialize = original;
  Deno.env.delete("OPTIMIZELY_SDK_KEY");
});

// Simulate userContext creation error with non-Error thrown
Deno.test("RTS function - userContext creation throws non-Error", async () => {
  Deno.env.set("OPTIMIZELY_SDK_KEY", "test-sdk-key-12345678901234567890");
  const origInit = OptimizelyClientManager.prototype.initialize;
  OptimizelyClientManager.prototype.initialize = function () {
    return Promise.resolve({
      createUserContext: () => {
        throw "not-an-error";
      },
    });
  };
  const request = new Request(RTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: "fail-user", attributes: {} }),
  });
  const response = await rtsFunction(request, mockContext);
  assertEquals(response.status, 500);
  const body = await response.json();
  assertEquals(body.success, false);
  assertExists(body.error);
  OptimizelyClientManager.prototype.initialize = origInit;
  Deno.env.delete("OPTIMIZELY_SDK_KEY");
});

// Simulate client initialization error with non-Error thrown
Deno.test("RTS function - client initialization throws non-Error", async () => {
  Deno.env.set("OPTIMIZELY_SDK_KEY", "test-sdk-key-12345678901234567890");
  const origInit = OptimizelyClientManager.prototype.initialize;
  OptimizelyClientManager.prototype.initialize = function () {
    throw "not-an-error";
  };
  const request = new Request(RTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: "fail-user", attributes: {} }),
  });
  const response = await rtsFunction(request, mockContext);
  assertEquals(response.status, 500);
  const body = await response.json();
  assertEquals(body.success, false);
  assertExists(body.error);
  OptimizelyClientManager.prototype.initialize = origInit;
  Deno.env.delete("OPTIMIZELY_SDK_KEY");
});

// Simulate service error with non-Error thrown
Deno.test("RTS function - service error throws non-Error", async () => {
  Deno.env.set("OPTIMIZELY_SDK_KEY", "test-sdk-key-12345678901234567890");
  const origInit = OptimizelyClientManager.prototype.initialize;
  const origProcess = RTSService.processUserSegments;
  OptimizelyClientManager.prototype.initialize = function () {
    return Promise.resolve({
      createUserContext: () => ({}),
    });
  };
  RTSService.processUserSegments = () => {
    throw "not-an-error";
  };
  const request = new Request(RTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: "fail-user", attributes: {} }),
  });
  const response = await rtsFunction(request, mockContext);
  assertEquals(response.status, 500);
  const body = await response.json();
  assertEquals(body.success, false);
  assertExists(body.error);
  OptimizelyClientManager.prototype.initialize = origInit;
  RTSService.processUserSegments = origProcess;
  Deno.env.delete("OPTIMIZELY_SDK_KEY");
});

// Simulate SDK key validation error with non-Error thrown
Deno.test("RTS function - SDK key validation throws non-Error", async () => {
  const origValidate = RequestValidator.validateSdkKey;
  RequestValidator.validateSdkKey = () => {
    throw "not-an-error";
  };
  const request = new Request(RTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: "fail-user", attributes: {} }),
  });
  const response = await rtsFunction(request, mockContext);
  assertEquals(response.status, 400);
  const body = await response.json();
  assertEquals(body.success, false);
  assertExists(body.error);
  RequestValidator.validateSdkKey = origValidate;
});

// Simulate parseAndValidate error with non-Error thrown (fallback message)
Deno.test("RTS function - parseAndValidate throws non-Error", async () => {
  const origParse = RequestValidator.parseAndValidate;
  RequestValidator.parseAndValidate = () => {
    throw "not-an-error";
  };
  const request = new Request(RTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: "fail-user", attributes: {} }),
  });
  const response = await rtsFunction(request, mockContext);
  assertEquals(response.status, 400);
  const body = await response.json();
  assertEquals(body.success, false);
  assertExists(body.error);
  RequestValidator.parseAndValidate = origParse;
});

// Simulate main catch-all error (unexpected error outside inner try/catch)
Deno.test("RTS function - main catch-all error returns 500", async () => {
  const origMethod = RequestValidator.parseAndValidate;
  RequestValidator.parseAndValidate = () => {
    throw new Error("outer error");
  };
  const request = new Request(RTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: "fail-user", attributes: {} }),
  });
  // Patch ResponseHelper.createValidationErrorResponse to throw to escape inner try/catch
  const origResp = ResponseHelper.createValidationErrorResponse;
  ResponseHelper.createValidationErrorResponse = () => {
    throw new Error("outer error");
  };
  const response = await rtsFunction(request, mockContext);
  assertEquals(response.status, 500);
  const body = await response.json();
  assertEquals(body.success, false);
  assertExists(body.error);
  RequestValidator.parseAndValidate = origMethod;
  ResponseHelper.createValidationErrorResponse = origResp;
});

// Test with missing attributes (should default to empty object)
Deno.test("RTS function - request with missing attributes", async () => {
  Deno.env.set("OPTIMIZELY_SDK_KEY", "test-sdk-key-12345678901234567890");
  const request = new Request(RTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: "test-user-missing-attrs" }),
  });
  const response = await rtsFunction(request, mockContext);
  assertEquals(response.headers.get("Content-Type"), "application/json");
  const body = await response.json();
  assertExists(body.success);
  assertEquals(typeof body.success, "boolean");
  assertExists(body.metadata);
  Deno.env.delete("OPTIMIZELY_SDK_KEY");
});

// Simulate service error
Deno.test("RTS function - service error returns 500", async () => {
  Deno.env.set("OPTIMIZELY_SDK_KEY", "test-sdk-key-12345678901234567890");
  const origInit = OptimizelyClientManager.prototype.initialize;
  const origProcess = RTSService.processUserSegments;
  OptimizelyClientManager.prototype.initialize = function () {
    return Promise.resolve({
      createUserContext: () => ({}),
    });
  };
  RTSService.processUserSegments = () => {
    throw new Error("Service failed");
  };
  const request = new Request(RTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: "fail-user", attributes: {} }),
  });
  const response = await rtsFunction(request, mockContext);
  assertEquals(response.status, 500);
  const body = await response.json();
  assertEquals(body.success, false);
  assertExists(body.error);
  OptimizelyClientManager.prototype.initialize = origInit;
  RTSService.processUserSegments = origProcess;
  Deno.env.delete("OPTIMIZELY_SDK_KEY");
});

// Simulate catch-all error
Deno.test("RTS function - catch-all error returns 400 (validation error)", async () => {
  Deno.env.set("OPTIMIZELY_SDK_KEY", "test-sdk-key-12345678901234567890");
  const origParse = RequestValidator.parseAndValidate;
  RequestValidator.parseAndValidate = () => {
    throw "unexpected error";
  };
  const request = new Request(RTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: "fail-user", attributes: {} }),
  });
  const response = await rtsFunction(request, mockContext);
  assertEquals(response.status, 400);
  const body = await response.json();
  assertEquals(body.success, false);
  assertExists(body.error);
  RequestValidator.parseAndValidate = origParse;
  Deno.env.delete("OPTIMIZELY_SDK_KEY");
});
