import { RTSTestMetadata, RTSTestResponse } from "./types.ts";

export class ResponseHelper {
  private static createHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    };
  }

  static createSuccessResponse(
    data: Omit<RTSTestResponse, "success">,
  ): Response {
    const response: RTSTestResponse = {
      success: true,
      ...data,
    };

    return new Response(
      JSON.stringify(response, null, 2),
      {
        status: 200,
        headers: this.createHeaders(),
      },
    );
  }

  static createErrorResponse(
    error: string,
    status: number = 500,
    metadata?: RTSTestMetadata,
  ): Response {
    const response: RTSTestResponse = {
      success: false,
      error,
      metadata,
    };

    return new Response(
      JSON.stringify(response, null, 2),
      {
        status,
        headers: this.createHeaders(),
      },
    );
  }

  static createCorsResponse(): Response {
    return new Response(null, {
      status: 200,
      headers: this.createHeaders(),
    });
  }

  static createMethodNotAllowedResponse(): Response {
    return this.createErrorResponse("Method not allowed. Use POST.", 405);
  }

  static createValidationErrorResponse(message: string): Response {
    return this.createErrorResponse(message, 400);
  }
}
