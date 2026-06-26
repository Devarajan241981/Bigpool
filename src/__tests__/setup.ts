/// <reference types="vitest/globals" />
import "@testing-library/jest-dom";

// Polyfill BroadcastChannel for jsdom
class BroadcastChannelMock {
  name: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  private static channels: Map<string, BroadcastChannelMock[]> = new Map();

  constructor(name: string) {
    this.name = name;
    if (!BroadcastChannelMock.channels.has(name)) {
      BroadcastChannelMock.channels.set(name, []);
    }
    BroadcastChannelMock.channels.get(name)!.push(this);
  }

  postMessage(data: unknown) {
    BroadcastChannelMock.channels.get(this.name)?.forEach((ch) => {
      if (ch !== this && ch.onmessage) {
        ch.onmessage(new MessageEvent("message", { data }));
      }
    });
  }

  close() {
    const list = BroadcastChannelMock.channels.get(this.name);
    if (list) {
      const idx = list.indexOf(this);
      if (idx !== -1) list.splice(idx, 1);
    }
  }

  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return true; }
}

Object.defineProperty(window, "BroadcastChannel", {
  writable: true,
  value: BroadcastChannelMock,
});

// Suppress console.error in tests for known issues
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("Warning:")) return;
    originalError(...args);
  };
});
afterAll(() => { console.error = originalError; });
