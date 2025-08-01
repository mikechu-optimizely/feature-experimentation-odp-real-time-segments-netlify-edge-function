// Test function for Optimizely SDK v6.0.0 Universal Bundle with RTS
// @ts-ignore - External module from esm.sh
import { createInstance } from 'https://esm.sh/@optimizely/optimizely-sdk@6.0.0/dist/index.universal.es.min.js';

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
  sdkVersion: string;
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

    const body: RTSTestRequest = await request.json();
    
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
    const sdkKey = body.sdkKey || Deno.env.get('OPTIMIZELY_SDK_KEY');
    if (!sdkKey) {
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

    // Configure Optimizely client with RTS-friendly settings
    const optimizelyClient = createInstance({
      sdkKey: sdkKey,
      // Configure for RTS - use eventBatchSize 1 as mentioned in the chat
      eventBatchSize: 1,
      // Add requestHandler implementation for Deno environment
      requestHandler: {
        makeRequest: async (url: string, options: any) => {
          try {
            const response = await fetch(url, {
              method: options.method || 'GET',
              headers: options.headers || {},
              body: options.body
            });
            
            return {
              statusCode: response.status,
              body: await response.text(),
              headers: Object.fromEntries(response.headers.entries())
            };
          } catch (error) {
            throw new Error(`Request failed: ${error.message}`);
          }
        }
      }
    });

    // Wait for SDK to be ready
    await optimizelyClient.onReady();

    // Test fetchQualifiedSegments
    const qualifiedSegments = await optimizelyClient.fetchQualifiedSegments(
      body.userId,
      body.attributes || {}
    );

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
        const flagResult = optimizelyClient.decide(body.userId, body.flagKey, body.attributes || {});
        response.metadata!.flagKey = body.flagKey;
        response.metadata!.flagResult = {
          variationKey: flagResult.variationKey,
          enabled: flagResult.enabled,
          reasons: flagResult.reasons
        };
      } catch (flagError) {
        console.warn('Flag evaluation failed:', flagError);
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
    console.error('RTS Test Error:', error);
    
    const errorResponse: RTSTestResponse = {
      success: false,
      error: error.message || 'Unknown error occurred',
      metadata: {
        userId: 'unknown',
        attributes: {},
        timestamp: new Date().toISOString(),
        sdkVersion: '6.0.0'
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
