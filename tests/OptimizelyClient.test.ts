import {
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import { OptimizelyClientManager } from "../src/OptimizelyClient.ts";

Deno.test("OptimizelyClientManager - initialize with valid SDK key", async () => {
  const manager = new OptimizelyClientManager();
  
  try {
    // This will fail because we don't have a real SDK key, but we can test the error handling
    await assertRejects(
      () => manager.initialize({
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
      () => manager.initialize({
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
      () => manager.initialize({
        sdkKey: "test-sdk-key",
        // No timeout specified
      }),
      Error,
    );
  } finally {
    manager.close();
  }
});
