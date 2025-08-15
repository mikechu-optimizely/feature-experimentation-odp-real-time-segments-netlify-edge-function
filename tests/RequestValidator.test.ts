import {
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import { RequestValidator } from "../src/RequestValidator.ts";

Deno.test("RequestValidator - parseAndValidate with valid request", async () => {
  const requestBody = {
    userId: "test-user",
    attributes: { country: "US" },
    flagKey: "test-flag",
  };

  const request = new Request("http://example.com", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  const result = await RequestValidator.parseAndValidate(request);
  assertEquals(result.userId, "test-user");
  assertEquals(result.attributes?.country, "US");
  assertEquals(result.flagKey, "test-flag");
});

Deno.test("RequestValidator - parseAndValidate with invalid JSON", async () => {
  const request = new Request("http://example.com", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "invalid json",
  });

  await assertRejects(
    () => RequestValidator.parseAndValidate(request),
    Error,
    "Failed to parse request body:",
  );
});

Deno.test("RequestValidator - parseAndValidate with missing userId", async () => {
  const requestBody = {
    userId: "",
    attributes: { country: "US" },
  };

  const request = new Request("http://example.com", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  await assertRejects(
    () => RequestValidator.parseAndValidate(request),
    Error,
    "userId is required",
  );
});

Deno.test("RequestValidator - parseAndValidate with null userId", async () => {
  const requestBody = {
    userId: null,
    attributes: { country: "US" },
  };

  const request = new Request("http://example.com", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  await assertRejects(
    () => RequestValidator.parseAndValidate(request),
    Error,
    "userId is required",
  );
});

Deno.test("RequestValidator - validateSdkKey with valid SDK key", () => {
  // Set a mock SDK key
  Deno.env.set("OPTIMIZELY_SDK_KEY", "test-sdk-key-123");

  const sdkKey = RequestValidator.validateSdkKey();
  assertEquals(sdkKey, "test-sdk-key-123");

  // Clean up
  Deno.env.delete("OPTIMIZELY_SDK_KEY");
});

Deno.test("RequestValidator - validateSdkKey with missing SDK key", () => {
  // Ensure SDK key is not set
  Deno.env.delete("OPTIMIZELY_SDK_KEY");

  try {
    RequestValidator.validateSdkKey();
    throw new Error("Should have thrown an error");
  } catch (error) {
    assertEquals(
      error instanceof Error ? error.message : String(error),
      "SDK key is required (set OPTIMIZELY_SDK_KEY env var or include in request body)",
    );
  }
});
