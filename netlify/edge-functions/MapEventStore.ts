interface EventStore {
  get(key: string): any;
  set(key: string, value: any): void;
  delete(key: string): boolean;
  clear(): void;
  getKeys(): string[];
}

export class MapEventStore implements EventStore {
  private store = new Map<string, any>();

  get(key: string): any {
    return this.store.get(key);
  }

  set(key: string, value: any): void {
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
