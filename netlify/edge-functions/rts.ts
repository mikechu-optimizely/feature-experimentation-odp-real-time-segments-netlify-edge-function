import {
  createBatchEventProcessor,
  createInstance,
  createPollingProjectConfigManager,
} from "https://cdn.skypack.dev/@optimizely/optimizely-sdk@6.0.0";

declare const Deno: any;

interface RTSTestRequest {
  userId: string;
  attributes?: Record<string, any>;
  sdkKey?: string;
  flagKey?: string;
}

interface RTSTestMetadata {
  userId: string;
  attributes: Record<string, any>;
  timestamp: string;
  flagKey?: string;
  flagResult?: {
    variationKey: string;
    enabled: boolean;
    reasons: string[];
  };
}

interface RTSTestResponse {
  success: boolean;
  qualifiedSegments?: string[];
  error?: string;
  metadata?: RTSTestMetadata;
}

export default async (request: Request, context: any): Promise<Response> => {
  // Variables to track parsed request data
  let parsedBody: RTSTestRequest | null = null;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
      }
    });
  }

  try {
    // Only handle POST requests
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Method not allowed. Use POST.'
        }),
        {
          status: 405,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    }

    // Parse request body with error handling
    let body: RTSTestRequest;
    try {
      body = await request.json();
      parsedBody = body; // Store for error handling
      console.debug('📝 Request body parsed successfully:', JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to parse request body: ${parseError.message}`
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    }

    // Validate required fields
    if (!body.userId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'userId is required'
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    }

    // Get SDK key from environment or request body
    const sdkKey = Deno.env.get('OPTIMIZELY_SDK_KEY');
    console.debug('🔑 SDK Key check - exists:', !!sdkKey, 'length:', sdkKey?.length || 0);

    if (!sdkKey) {
    console.error('🚫 OPTIMIZELY_SDK_KEY not found in environment variables');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'SDK key is required (set OPTIMIZELY_SDK_KEY env var or include in request body)'
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    }

    const pollingConfigManager = createPollingProjectConfigManager({
      sdkKey,
      autoUpdate: true,
      updateInterval: 60_000, // 1 minute
    });

    const batchEventProcessor = createBatchEventProcessor();

    const optimizelyClient = createInstance({
      projectConfigManager: pollingConfigManager,
      eventProcessor: batchEventProcessor,
    });

    // Wait for SDK to be ready with timeout
    try {
      await optimizelyClient.onReady({ timeout: 15_000 }); // 15 second timeout
      console.info('✅ SDK is ready!');
    } catch (readyError) {
      console.error('❌ Optimizely SDK failed to initialize:', readyError);
      // Try to get more specific error information
      const isValid = optimizelyClient.isValid();
      console.debug('🔍 SDK isValid:', isValid);
      throw new Error(`Failed to initialize Optimizely SDK: ${readyError.message}. SDK valid: ${isValid}`);
    }

    // Create user context
    let userContext;
    try {
      userContext = optimizelyClient.createUserContext(body.userId, body.attributes || {});
      if (!userContext) {
        throw new Error('Failed to create user context');
      }
    } catch (contextError) {
      console.error('👤 Failed to create user context:', contextError);
      throw new Error(`Failed to create user context: ${contextError.message}`);
    }

    // Test fetchQualifiedSegments
    let qualifiedSegments = [];
    try {
      qualifiedSegments = await userContext.fetchQualifiedSegments();
      console.info(`🏷️ Qualified segments fetched successfully: ${qualifiedSegments?.length || 0}`);
    } catch (segmentsError) {
      console.warn('⚠️ Failed to fetch qualified segments:', segmentsError);
      // Don't throw here, just log the error and continue with empty segments
      qualifiedSegments = [];
    }

    const response: RTSTestResponse = {
      success: true,
      qualifiedSegments: qualifiedSegments || [],
      metadata: {
        userId: body.userId,
        attributes: body.attributes || {},
        timestamp: new Date().toISOString(),
        sdkVersion: '6.0.0'
      }
    };

    // If a flag key is provided, also test flag evaluation
    if (body.flagKey) {
      try {
        const flagResult = userContext.decide(body.flagKey);
        response.metadata!.flagKey = body.flagKey;
        response.metadata!.flagResult = {
          variationKey: flagResult.variationKey || 'null',
          enabled: flagResult.enabled || false,
          reasons: flagResult.reasons || []
        };
      } catch (flagError) {
        console.warn('🚩 Flag evaluation failed:', flagError);
      }
    }

    return new Response(
      JSON.stringify(response, null, 2),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
        }
      }
    );

  } catch (error) {
    console.error('💥 RTS Test Error:', error);

    const errorResponse: RTSTestResponse = {
      success: false,
      error: error.message || 'Unknown error occurred',
      metadata: {
        userId: parsedBody?.userId || 'unknown',
        attributes: parsedBody?.attributes || {},
        timestamp: new Date().toISOString(),
      }
    };

    return new Response(
      JSON.stringify(errorResponse, null, 2),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  }
};
function createPollingProjectConfigManager(arg0: { sdkKey: any; autoUpdate: boolean; updateInterval: number; }) {
  throw new Error('Function not implemented.');
}

