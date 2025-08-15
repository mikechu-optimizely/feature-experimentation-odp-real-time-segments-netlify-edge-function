import {
  createForwardingEventProcessor,
  createInstance,
  createOdpManager,
  createPollingProjectConfigManager,
} from "https://cdn.skypack.dev/@optimizely/optimizely-sdk@6.0.0/universal";

export interface OptimizelyClientConfig {
  sdkKey: string;
  updateInterval?: number;
  timeout?: number;
}

// Custom request handler that returns AbortableRequest
interface AbortableRequest {
  responsePromise: Promise<{
    statusCode: number;
    body: string;
    headers: Record<string, string>;
  }>;
  abort: () => void;
}

interface RequestHandler {
  makeRequest(
    url: string,
    headers?: Record<string, string>,
    method?: string,
    data?: string,
  ): AbortableRequest;
}

class CustomRequestHandler implements RequestHandler {
  private activeControllers = new Set<AbortController>();

  makeRequest(
    url: string,
    headers: Record<string, string> = {},
    method: string = "GET",
    data?: string,
  ): AbortableRequest {
    const controller = new AbortController();
    this.activeControllers.add(controller);

    const requestOptions: RequestInit = {
      method,
      headers,
      signal: controller.signal,
    };

    if (data && (method === "POST" || method === "PUT")) {
      requestOptions.body = data;
    }

    const responsePromise = fetch(url, requestOptions)
      .then(async (response) => {
        const body = await response.text();
        this.activeControllers.delete(controller);
        return {
          statusCode: response.status,
          body: body, // Return the body as a string, not a Promise
          headers: Object.fromEntries(response.headers.entries()),
        };
      })
      .catch((error) => {
        this.activeControllers.delete(controller);
        if (error.name === "AbortError") {
          throw new Error("Request aborted");
        }
        throw error;
      });

    return {
      responsePromise,
      abort: () => {
        controller.abort();
        this.activeControllers.delete(controller);
      },
    };
  }

  abortAll(): void {
    for (const controller of this.activeControllers) {
      controller.abort();
    }
    this.activeControllers.clear();
  }
}

// Custom event dispatcher
const customEventDispatcher = {
  dispatchEvent: (event: unknown) => {
    console.debug("📤 Sending event to Optimizely:", event);
    return Promise.resolve({});
  },
};

export class OptimizelyClientManager {
  private client: ReturnType<typeof createInstance> | null = null;
  private pollingConfigManager:
    | ReturnType<typeof createPollingProjectConfigManager>
    | null = null;
  private odpManager: ReturnType<typeof createOdpManager> | null = null;
  private requestHandler: CustomRequestHandler | null = null;

  async initialize(config: OptimizelyClientConfig): Promise<unknown> {
    this.requestHandler = new CustomRequestHandler();

    this.pollingConfigManager = createPollingProjectConfigManager({
      sdkKey: config.sdkKey,
      requestHandler: this.requestHandler,
    });

    // Create forwarding event processor with custom event dispatcher
    const forwardingEventProcessor = createForwardingEventProcessor(
      customEventDispatcher,
    );

    this.odpManager = createOdpManager({
      eventApiTimeout: 1_000,
      segmentsApiTimeout: 1_000,
      segmentsCacheSize: 10,
      segmentsCacheTimeout: 1_000,
      eventBatchSize: 5,
      eventFlushInterval: 3_000,
      requestHandler: this.requestHandler,
    });

    this.client = createInstance({
      projectConfigManager: this.pollingConfigManager,
      eventProcessor: forwardingEventProcessor,
      disposable: true, // Enable auto-disposal for edge environment
      requestHandler: this.requestHandler,
      odpManager: this.odpManager,
    });

    // Wait for SDK to be ready with timeout
    const timeout = config.timeout || 2_000;
    try {
      await this.client.onReady({ timeout });
      console.info("✅ SDK is ready!");
    } catch (error) {
      // Ensure we close the client if initialization fails
      this.close();
      throw error;
    }

    return this.client;
  }

  getClient(): ReturnType<typeof createInstance> | null {
    return this.client;
  }

  close(): void {
    // First, abort any active HTTP requests
    if (this.requestHandler) {
      this.requestHandler.abortAll();
    }

    if (this.client) {
      try {
        if (typeof this.client.close === "function") {
          this.client.close();
        }
        this.client = null;
        console.debug("🔄 Optimizely client closed successfully");
      } catch (error) {
        console.warn("⚠️ Error closing Optimizely client:", error);
        this.client = null; // Still null it out even if close failed
      }
    }

    // Clear manager references
    this.pollingConfigManager = null;
    this.odpManager = null;
    this.requestHandler = null;
  }
}
