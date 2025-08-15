import {
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.208.0/assert/mod.ts";

Deno.test("OptimizelyClientManager - initialize with valid SDK key", async () => {
  const manager = new OptimizelyClientManager();

  try {
    // This will fail because we don't have a real SDK key, but we can test the error handling
    await assertRejects(
      () =>
        manager.initialize({
          sdkKey: "test-sdk-key",
          timeout: 1000,
        }),
      Error,
    );
  } finally {
    manager.close();
  }
});

Deno.test("OptimizelyClientManager - initialize with custom timeout", async () => {
  const manager = new OptimizelyClientManager();

  try {
    await assertRejects(
      () =>
        manager.initialize({
          sdkKey: "test-sdk-key",
          timeout: 500,
        }),
      Error,
    );
  } finally {
    manager.close();
  }
});

Deno.test("OptimizelyClientManager - getClient returns null when not initialized", () => {
  const manager = new OptimizelyClientManager();

  const client = manager.getClient();
  assertEquals(client, null);

  manager.close();
});

Deno.test("OptimizelyClientManager - close without initialization", () => {
  const manager = new OptimizelyClientManager();

  // Should not throw an error
  manager.close();

  const client = manager.getClient();
  assertEquals(client, null);
});

Deno.test("OptimizelyClientManager - multiple close calls", () => {
  const manager = new OptimizelyClientManager();

  // Should not throw an error when called multiple times
  manager.close();
  manager.close();
  manager.close();

  const client = manager.getClient();
  assertEquals(client, null);
});

Deno.test("OptimizelyClientManager - initialize with default timeout", async () => {
  const manager = new OptimizelyClientManager();

  try {
    // Test with default timeout (should be 2000ms)
    await assertRejects(
      () =>
        manager.initialize({
          sdkKey: "test-sdk-key",
          // No timeout specified
        }),
      Error,
    );
  } finally {
    manager.close();
  }
});

Deno.test("OptimizelyClientManager - initialize with very short timeout", async () => {
  const manager = new OptimizelyClientManager();

  try {
    // Test with very short timeout to force timeout error
    await assertRejects(
      () =>
        manager.initialize({
          sdkKey: "test-sdk-key-short-timeout",
          timeout: 1, // 1ms timeout should always fail
        }),
      Error,
    );
  } finally {
    manager.close();
  }
});

Deno.test("OptimizelyClientManager - initialize with empty SDK key", async () => {
  const manager = new OptimizelyClientManager();

  try {
    await assertRejects(
      () =>
        manager.initialize({
          sdkKey: "",
          timeout: 1000,
        }),
      Error,
    );
  } finally {
    manager.close();
  }
});

Deno.test("OptimizelyClientManager - initialize with null SDK key", async () => {
  const manager = new OptimizelyClientManager();

  try {
    await assertRejects(
      () =>
        manager.initialize({
          sdkKey: null as unknown as string,
          timeout: 1000,
        }),
      Error,
    );
  } finally {
    manager.close();
  }
});

Deno.test("OptimizelyClientManager - initialize with invalid SDK key format", async () => {
  const manager = new OptimizelyClientManager();

  try {
    await assertRejects(
      () =>
        manager.initialize({
          sdkKey: "invalid-sdk-key-format-123",
          timeout: 100,
        }),
      Error,
    );
  } finally {
    manager.close();
  }
});

Deno.test("OptimizelyClientManager - close after failed initialization", async () => {
  const manager = new OptimizelyClientManager();

  try {
    await assertRejects(
      () =>
        manager.initialize({
          sdkKey: "test-failed-init",
          timeout: 10,
        }),
      Error,
    );
  } catch {
    // Expected to fail
  } finally {
    // Should not throw even after failed initialization
    manager.close();
    assertEquals(manager.getClient(), null);
  }
});

import { OptimizelyClientManager } from "../src/OptimizelyClient.ts";
// Import CustomRequestHandler for direct testing
// @ts-ignore: Accessing internal class for test coverage
import { CustomRequestHandler } from "../src/OptimizelyClient.ts";

Deno.test("CustomRequestHandler - aborts request and handles AbortError", async () => {
  // @ts-ignore: Accessing internal class for test coverage
  const handler = new CustomRequestHandler();
  const abortable = handler.makeRequest(
    "https://httpbin.org/delay/3",
    {},
    "GET",
  );
  abortable.abort();
  await assertRejects(
    () => abortable.responsePromise,
    Error,
    "Request aborted",
  );
});

Deno.test("CustomRequestHandler - handles fetch error", async () => {
  // @ts-ignore: Accessing internal class for test coverage
  const handler = new CustomRequestHandler();
  // Intentionally use an invalid URL to cause fetch to throw
  const abortable = handler.makeRequest("http://invalid.localhost", {}, "GET");
  await assertRejects(() => abortable.responsePromise, Error);
});
