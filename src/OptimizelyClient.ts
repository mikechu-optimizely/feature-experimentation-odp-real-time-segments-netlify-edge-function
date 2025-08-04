import {
  createBatchEventProcessor,
  createInstance,
  createPollingProjectConfigManager,
} from "https://cdn.skypack.dev/@optimizely/optimizely-sdk@6.0.0/universal";
import { MapEventStore } from "./MapEventStore.ts";

declare const Deno: any;

export interface OptimizelyClientConfig {
  sdkKey: string;
  updateInterval?: number;
  timeout?: number;
}

export class OptimizelyClientManager {
  private client: any = null;

  async initialize(config: OptimizelyClientConfig): Promise<any> {
    const pollingConfigManager = createPollingProjectConfigManager({
      sdkKey: config.sdkKey,
      requestHandler: {
        makeRequest: async (requestUrl: string, headers: Headers, method: any, data?: string) => {
          const response = await fetch(requestUrl, {
            method,
            headers,
            body: data,
            signal: AbortSignal.timeout(5_000),
          });
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Request to ${requestUrl} failed with status ${response.status}: ${errorText}`);
            return "{}";
          }
          const jsonData = await response.json();
          //console.debug(`📥 Fetched config from ${requestUrl}:`, JSON.stringify(jsonData, null, 2));
          return jsonData;
        },
      },
      updateInterval: config.updateInterval || 60_000, // 1 minute
    });

    const batchEventProcessor = createBatchEventProcessor({
      eventStore: new MapEventStore(),
      eventDispatcher: {
        dispatchEvent: async (event: any) => {
          console.debug('📤 Sending event to Optimizely:', event);
        },
      },
    });

    this.client = createInstance({
      projectConfigManager: pollingConfigManager,
      eventProcessor: batchEventProcessor,
      disposable: true, // Enable auto-disposal for edge environment
    });

    // Wait for SDK to be ready with timeout
    await this.client.onReady({ timeout: config.timeout || 5_000 });
    console.info('✅ SDK is ready!');

    return this.client;
  }

  getClient(): any {
    return this.client;
  }

  close(): void {
    if (this.client && typeof this.client.close === 'function') {
      try {
        this.client.close();
        console.debug('🔄 Optimizely client closed successfully');
      } catch (error) {
        console.warn('⚠️ Error closing Optimizely client:', error);
      }
    }
  }
}
