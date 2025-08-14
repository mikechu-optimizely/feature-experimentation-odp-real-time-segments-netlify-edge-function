interface EventStore {
  get(key: string): unknown;
  set(key: string, value: unknown): void;
  delete(key: string): boolean;
  clear(): void;
  getKeys(): string[];
}

export class MapEventStore implements EventStore {
  private store = new Map<string, unknown>();

  get(key: string): unknown {
    return this.store.get(key);
  }

  set(key: string, value: unknown): void {
    this.store.set(key, value);
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  getKeys(): string[] {
    return Array.from(this.store.keys());
  }
}
