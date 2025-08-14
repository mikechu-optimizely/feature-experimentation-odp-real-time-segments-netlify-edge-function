import {
  createEventDispatcher,
  createInstance,
  createStaticProjectConfigManager,
} from "https://cdn.skypack.dev/@optimizely/optimizely-sdk@6.0.0/universal";
import { MapEventStore } from "./MapEventStore.ts";

export interface OptimizelyClientConfig {
  sdkKey: string;
  updateInterval?: number;
  timeout?: number;
}

export class OptimizelyClientManager {
  private client: ReturnType<typeof createInstance> | null = null;

  async initialize(config: OptimizelyClientConfig): Promise<unknown> {
    const staticConfigManager = createStaticProjectConfigManager({
      sdkKey: config.sdkKey,
    });

    const batchEventProcessor = createEventDispatcher({
      eventStore: new MapEventStore(),
      eventDispatcher: {
        dispatchEvent: (event: unknown) => {
          console.debug('📤 Sending event to Optimizely:', event);
        },
      },
    });

    this.client = createInstance({
      projectConfigManager: staticConfigManager,
      eventProcessor: batchEventProcessor,
      disposable: true, // Enable auto-disposal for edge environment
    });

    // Wait for SDK to be ready with timeout
    await this.client.onReady({ timeout: config.timeout || 5_000 });
    console.info('✅ SDK is ready!');

    return this.client;
  }

  getClient(): ReturnType<typeof createInstance> | null {
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
