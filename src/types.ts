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
