import { RTSTestRequest } from "../../src/types.ts";
import { OptimizelyClientManager } from "../../src/OptimizelyClient.ts";
import { ResponseHelper } from "../../src/ResponseHelper.ts";
import { RequestValidator } from "../../src/RequestValidator.ts";
import { RTSService } from "../../src/RTSService.ts";

// Interface for Optimizely Client
interface OptimizelyClient {
  createUserContext(userId: string, attributes: Record<string, unknown>): OptimizelyUserContext;
}

// Interface for Optimizely UserContext  
interface OptimizelyUserContext {
  fetchQualifiedSegments(): Promise<string[]>;
  decide(flagKey: string): {
    variationKey?: string;
    enabled?: boolean;
    reasons?: string[];
  };
}

export default async (request: Request, _context: unknown): Promise<Response> => {
  // Variables to track parsed request data
  let parsedBody: RTSTestRequest | null = null;
  const clientManager = new OptimizelyClientManager();

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return ResponseHelper.createCorsResponse();
  }

  try {
    // Only handle POST requests
    if (request.method !== "POST") {
      return ResponseHelper.createMethodNotAllowedResponse();
    }

    // Parse and validate request
    try {
      parsedBody = await RequestValidator.parseAndValidate(request);
    } catch (validationError) {
      return ResponseHelper.createValidationErrorResponse(
        validationError instanceof Error
          ? validationError.message
          : "Validation failed",
      );
    }

    // Validate SDK key
    let sdkKey: string;
    try {
      sdkKey = RequestValidator.validateSdkKey();
    } catch (sdkError) {
      return ResponseHelper.createValidationErrorResponse(
        sdkError instanceof Error
          ? sdkError.message
          : "SDK key validation failed",
      );
    }

    // Initialize Optimizely client
    let optimizelyClient: OptimizelyClient;
    try {
      optimizelyClient = await clientManager.initialize({ sdkKey }) as OptimizelyClient;
    } catch (initError) {
      console.error("❌ Optimizely SDK failed to initialize:", initError);
      return ResponseHelper.createErrorResponse(
        `Failed to initialize Optimizely SDK: ${
          initError instanceof Error
            ? initError.message
            : "Unknown initialization error"
        }`,
        500,
        {
          userId: parsedBody.userId,
          attributes: parsedBody.attributes || {},
          timestamp: new Date().toISOString(),
        },
      );
    }

    // Create user context
    let userContext: OptimizelyUserContext;
    try {
      userContext = optimizelyClient.createUserContext(
        parsedBody.userId,
        parsedBody.attributes || {},
      );
      if (!userContext) {
        clientManager.close();
        return ResponseHelper.createErrorResponse(
          "Failed to create user context",
          500,
          {
            userId: parsedBody.userId,
            attributes: parsedBody.attributes || {},
            timestamp: new Date().toISOString(),
          },
        );
      }
    } catch (contextError) {
      console.error("👤 Failed to create user context:", contextError);
      clientManager.close();
      return ResponseHelper.createErrorResponse(
        `Failed to create user context: ${
          contextError instanceof Error
            ? contextError.message
            : "Unknown context error"
        }`,
        500,
        {
          userId: parsedBody.userId,
          attributes: parsedBody.attributes || {},
          timestamp: new Date().toISOString(),
        },
      );
    }

    // Process user segments and flags
    try {
      const { qualifiedSegments, metadata } = await RTSService
        .processUserSegments(userContext, parsedBody);

      // Clean up the client after successful execution
      clientManager.close();

      return ResponseHelper.createSuccessResponse({
        qualifiedSegments,
        metadata,
      });
    } catch (serviceError) {
      console.error("🔧 Service processing failed:", serviceError);
      clientManager.close();
      return ResponseHelper.createErrorResponse(
        `Service processing failed: ${
          serviceError instanceof Error
            ? serviceError.message
            : "Unknown service error"
        }`,
        500,
        {
          userId: parsedBody.userId,
          attributes: parsedBody.attributes || {},
          timestamp: new Date().toISOString(),
        },
      );
    }
  } catch (error) {
    console.error("💥 RTS Test Error:", error);

    // Clean up the client if it was created
    clientManager.close();

    return ResponseHelper.createErrorResponse(
      error instanceof Error ? error.message : "Unknown error occurred",
      500,
      parsedBody
        ? {
          userId: (parsedBody as RTSTestRequest).userId,
          attributes: (parsedBody as RTSTestRequest).attributes || {},
          timestamp: new Date().toISOString(),
        }
        : {
          userId: "unknown",
          attributes: {},
          timestamp: new Date().toISOString(),
        },
    );
  }
};
