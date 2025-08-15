export interface RTSTestRequest {
  userId: string;
  attributes?: Record<string, unknown>;
  sdkKey?: string;
  flagKey?: string;
}

export interface RTSTestMetadata {
  userId: string;
  attributes: Record<string, unknown>;
  timestamp: string;
  flagKey?: string;
  flagResult?: {
    variationKey: string;
    enabled: boolean;
    reasons: string[];
  };
}

export interface RTSTestResponse {
  success: boolean;
  qualifiedSegments?: string[];
  error?: string;
  metadata?: RTSTestMetadata;
}

// Optimizely SDK interfaces (shared across multiple files)
export interface OptimizelyClient {
  createUserContext(
    userId: string,
    attributes: Record<string, unknown>,
  ): OptimizelyUserContext;
}

export interface OptimizelyUserContext {
  fetchQualifiedSegments(options?: unknown[]): Promise<boolean>;
  qualifiedSegments: string[];
  decide(flagKey: string): {
    variationKey?: string;
    enabled?: boolean;
    reasons?: string[];
  };
}
