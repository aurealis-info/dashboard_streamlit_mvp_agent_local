import '@testing-library/jest-dom/vitest'

class TestResizeObserver implements ResizeObserver {
  constructor(private readonly callback: ResizeObserverCallback) {}

  observe(target: Element) {
    this.callback([{
      target,
      contentRect: target.getBoundingClientRect(),
    } as ResizeObserverEntry], this)
  }

  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, 'ResizeObserver', { writable: true, value: TestResizeObserver })
Object.defineProperty(globalThis, 'ResizeObserver', { writable: true, value: TestResizeObserver })

Object.defineProperties(HTMLElement.prototype, {
  clientWidth: { configurable: true, get: () => 1280 },
  clientHeight: { configurable: true, get: () => 720 },
  offsetWidth: { configurable: true, get: () => 1280 },
  offsetHeight: { configurable: true, get: () => 720 },
})

HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
  return { x: 0, y: 0, top: 0, left: 0, right: 1280, bottom: 720, width: 1280, height: 720, toJSON: () => ({}) }
}

HTMLElement.prototype.hasPointerCapture = () => false
HTMLElement.prototype.setPointerCapture = () => {}
HTMLElement.prototype.releasePointerCapture = () => {}
HTMLElement.prototype.scrollIntoView = () => {}
