export interface AbortableRequest {
  responsePromise: Promise<{
    statusCode: number;
    body: string;
    headers: Record<string, string>;
  }>;
  abort: () => void;
}

export interface RequestHandler {
  makeRequest(
    url: string,
    headers?: Record<string, string>,
    method?: string,
    data?: string,
  ): AbortableRequest;
}

export interface OptimizelyClientConfig {
  sdkKey: string;
  updateInterval?: number;
  timeout?: number;
}

import type { createInstance } from "https://cdn.skypack.dev/@optimizely/optimizely-sdk@6.0.0/universal";

// Extract types from the Optimizely SDK using ReturnType inference
type OptimizelyInstance = ReturnType<typeof createInstance>;
export type OptimizelyUserContext = ReturnType<
  OptimizelyInstance["createUserContext"]
>;
export type OptimizelyDecision = ReturnType<OptimizelyUserContext["decide"]>;
export type UserAttributes = Record<string, unknown>;
export type EventTags = Record<string, string | number | boolean>;

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

// Use the actual Optimizely client instance type
export type OptimizelyClient = OptimizelyInstance;
