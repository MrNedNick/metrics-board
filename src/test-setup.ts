import '@testing-library/jest-dom/vitest'

// jsdom has no <dialog> behaviour, and the modal in the registry is built on
// the real element. This is the smallest stand-in that keeps the tests honest:
// open/close state and the close event, nothing else.
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.open = false
    this.dispatchEvent(new Event('close'))
  }
}

// recharts measures its container; jsdom reports zero for everything.
Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 900 })
Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 320 })
