import {
  assertEquals,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import { ResponseHelper } from "../src/ResponseHelper.ts";

Deno.test("ResponseHelper - createSuccessResponse", async () => {
  const data = {
    qualifiedSegments: ["segment1", "segment2"],
    metadata: {
      userId: "test-user",
      attributes: { country: "US" },
      timestamp: "2025-01-01T00:00:00.000Z",
    },
  };

  const response = ResponseHelper.createSuccessResponse(data);

  assertEquals(response.status, 200);
  assertEquals(response.headers.get("Content-Type"), "application/json");
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
  assertEquals(response.headers.get("Access-Control-Allow-Headers"), "Content-Type");
  assertEquals(response.headers.get("Access-Control-Allow-Methods"), "GET, POST, OPTIONS");

  const body = await response.json();
  assertEquals(body.success, true);
  assertEquals(body.qualifiedSegments, ["segment1", "segment2"]);
  assertEquals(body.metadata.userId, "test-user");
});

Deno.test("ResponseHelper - createErrorResponse with default status", async () => {
  const response = ResponseHelper.createErrorResponse("Test error");

  assertEquals(response.status, 500);
  assertEquals(response.headers.get("Content-Type"), "application/json");

  const body = await response.json();
  assertEquals(body.success, false);
  assertEquals(body.error, "Test error");
});

Deno.test("ResponseHelper - createErrorResponse with custom status", async () => {
  const metadata = {
    userId: "test-user",
    attributes: { country: "CA" },
    timestamp: "2025-01-01T00:00:00.000Z",
  };

  const response = ResponseHelper.createErrorResponse("Validation error", 400, metadata);

  assertEquals(response.status, 400);

  const body = await response.json();
  assertEquals(body.success, false);
  assertEquals(body.error, "Validation error");
  assertEquals(body.metadata?.userId, "test-user");
});

Deno.test("ResponseHelper - createCorsResponse", () => {
  const response = ResponseHelper.createCorsResponse();

  assertEquals(response.status, 200);
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
  assertEquals(response.headers.get("Access-Control-Allow-Headers"), "Content-Type");
  assertEquals(response.headers.get("Access-Control-Allow-Methods"), "GET, POST, OPTIONS");
});

Deno.test("ResponseHelper - createMethodNotAllowedResponse", async () => {
  const response = ResponseHelper.createMethodNotAllowedResponse();

  assertEquals(response.status, 405);
  assertEquals(response.headers.get("Content-Type"), "application/json");

  const body = await response.json();
  assertEquals(body.success, false);
  assertEquals(body.error, "Method not allowed. Use POST.");
});

Deno.test("ResponseHelper - createValidationErrorResponse", async () => {
  const response = ResponseHelper.createValidationErrorResponse("Invalid input");

  assertEquals(response.status, 400);
  assertEquals(response.headers.get("Content-Type"), "application/json");

  const body = await response.json();
  assertEquals(body.success, false);
  assertEquals(body.error, "Invalid input");
});
