import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import { RTSService } from "../src/RTSService.ts";
import { OptimizelyUserContext, RTSTestRequest } from "../src/types.ts";

// Mock user context for testing
const createMockUserContext = (
  fetchResult: boolean = true,
  segments: string[] = [],
  flagResult: {
    variationKey: string | null;
    enabled: boolean;
    reasons: string[];
  } | null = null,
): OptimizelyUserContext => {
  return {
    fetchQualifiedSegments: (_options: unknown) => {
      console.info(
        `🏷️ Qualified segments fetched successfully: ${segments.length}`,
      );
      return Promise.resolve(fetchResult);
    },
    qualifiedSegments: segments,
    decide: (_flagKey: string) => {
      if (flagResult) {
        return flagResult;
      }
      // Default flag result
      return {
        variationKey: "control",
        enabled: true,
        reasons: ["TRAFFIC_ALLOCATED"],
      };
    },
  } as OptimizelyUserContext;
};

Deno.test("RTSService - processUserSegments with successful fetch", async () => {
  const userContext = createMockUserContext(true, ["segment1", "segment2"]);
  const request: RTSTestRequest = {
    userId: "test-user",
    attributes: { country: "US" },
  };

  const result = await RTSService.processUserSegments(userContext, request);

  assertEquals(result.qualifiedSegments, ["segment1", "segment2"]);
  assertEquals(result.metadata.userId, "test-user");
  assertEquals(result.metadata.attributes.country, "US");
  assertExists(result.metadata.timestamp);
});

Deno.test("RTSService - processUserSegments with failed fetch", async () => {
  const userContext = createMockUserContext(false, []);
  const request: RTSTestRequest = {
    userId: "test-user",
    attributes: { country: "CA" },
  };

  const result = await RTSService.processUserSegments(userContext, request);

  assertEquals(result.qualifiedSegments, []);
  assertEquals(result.metadata.userId, "test-user");
  assertEquals(result.metadata.attributes.country, "CA");
  assertExists(result.metadata.timestamp);
});

Deno.test("RTSService - processUserSegments with flagKey", async () => {
  const flagResult = {
    variationKey: "treatment",
    enabled: true,
    reasons: ["FEATURE_FLAG_ENABLED"],
  };
  const userContext = createMockUserContext(true, ["segment1"], flagResult);
  const request: RTSTestRequest = {
    userId: "test-user",
    attributes: { country: "US" },
    flagKey: "test-flag",
  };

  const result = await RTSService.processUserSegments(userContext, request);

  assertEquals(result.qualifiedSegments, ["segment1"]);
  assertEquals(result.metadata.userId, "test-user");
  assertEquals(result.metadata.flagKey, "test-flag");
  assertExists(result.metadata.flagResult);
  assertEquals(result.metadata.flagResult?.variationKey, "treatment");
  assertEquals(result.metadata.flagResult?.enabled, true);
});

Deno.test("RTSService - processUserSegments with error in fetchQualifiedSegments", async () => {
  const userContext = {
    fetchQualifiedSegments: (_options: unknown) => {
      throw new Error("Network error");
    },
    qualifiedSegments: [],
    decide: (_flagKey: string) => ({
      variationKey: "control",
      enabled: true,
      reasons: ["TRAFFIC_ALLOCATED"],
    }),
  } as unknown as OptimizelyUserContext;

  const request: RTSTestRequest = {
    userId: "test-user",
    attributes: { country: "US" },
  };

  const result = await RTSService.processUserSegments(userContext, request);

  assertEquals(result.qualifiedSegments, []);
  assertEquals(result.metadata.userId, "test-user");
  assertExists(result.metadata.timestamp);
});

Deno.test("RTSService - processUserSegments with error in flag evaluation", async () => {
  const userContext = {
    fetchQualifiedSegments: (_options: unknown) => Promise.resolve(true),
    qualifiedSegments: ["segment1"],
    decide: (_flagKey: string) => {
      throw new Error("Flag evaluation error");
    },
  } as unknown as OptimizelyUserContext;

  const request: RTSTestRequest = {
    userId: "test-user",
    attributes: { country: "US" },
    flagKey: "test-flag",
  };

  const result = await RTSService.processUserSegments(userContext, request);

  assertEquals(result.qualifiedSegments, ["segment1"]);
  assertEquals(result.metadata.userId, "test-user");
  assertEquals(result.metadata.flagKey, "test-flag");
  // flagResult should not be set due to error, but flagKey should still be present
  assertEquals(result.metadata.flagResult, undefined);
});

Deno.test("RTSService - processUserSegments with no attributes", async () => {
  const userContext = createMockUserContext(true, []);
  const request: RTSTestRequest = {
    userId: "test-user",
    // No attributes provided
  };

  const result = await RTSService.processUserSegments(userContext, request);

  assertEquals(result.qualifiedSegments, []);
  assertEquals(result.metadata.userId, "test-user");
  assertEquals(result.metadata.attributes, {});
  assertExists(result.metadata.timestamp);
});

Deno.test("RTSService - processUserSegments with empty segments array", async () => {
  const userContext = createMockUserContext(true, []);
  const request: RTSTestRequest = {
    userId: "test-user",
    attributes: { country: "US", age: 30 },
  };

  const result = await RTSService.processUserSegments(userContext, request);

  assertEquals(result.qualifiedSegments, []);
  assertEquals(result.metadata.userId, "test-user");
  assertEquals(result.metadata.attributes.country, "US");
  assertEquals(result.metadata.attributes.age, 30);
  assertExists(result.metadata.timestamp);
});

Deno.test("RTSService - processUserSegments with flag having null variation", async () => {
  const flagResult = {
    variationKey: null,
    enabled: false,
    reasons: ["FLAG_DISABLED"],
  };
  const userContext = createMockUserContext(true, ["segment1"], flagResult);
  const request: RTSTestRequest = {
    userId: "test-user",
    attributes: { country: "US" },
    flagKey: "disabled-flag",
  };

  const result = await RTSService.processUserSegments(userContext, request);

  assertEquals(result.qualifiedSegments, ["segment1"]);
  assertEquals(result.metadata.userId, "test-user");
  assertEquals(result.metadata.flagKey, "disabled-flag");
  assertExists(result.metadata.flagResult);
  assertEquals(result.metadata.flagResult?.variationKey, "null");
  assertEquals(result.metadata.flagResult?.enabled, false);
});

Deno.test("RTSService - processUserSegments with flag having empty reasons", async () => {
  const flagResult = {
    variationKey: "control",
    enabled: true,
    reasons: [],
  };
  const userContext = createMockUserContext(true, ["segment1"], flagResult);
  const request: RTSTestRequest = {
    userId: "test-user",
    attributes: { country: "US" },
    flagKey: "no-reasons-flag",
  };

  const result = await RTSService.processUserSegments(userContext, request);

  assertEquals(result.qualifiedSegments, ["segment1"]);
  assertEquals(result.metadata.flagResult?.reasons, []);
});

Deno.test("RTSService - processUserSegments with undefined qualified segments", async () => {
  const userContext = {
    fetchQualifiedSegments: (_options: unknown) => Promise.resolve(true),
    qualifiedSegments: undefined,
    decide: (_flagKey: string) => ({
      variationKey: "control",
      enabled: true,
      reasons: ["TRAFFIC_ALLOCATED"],
    }),
  } as unknown as OptimizelyUserContext;

  const request: RTSTestRequest = {
    userId: "test-user",
    attributes: { country: "US" },
  };

  const result = await RTSService.processUserSegments(userContext, request);

  // Should handle undefined gracefully
  assertEquals(result.qualifiedSegments, undefined);
  assertEquals(result.metadata.userId, "test-user");
});
