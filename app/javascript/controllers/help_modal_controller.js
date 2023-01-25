import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ['container', 'background']

  open() {
    this.containerTarget.dataset.open = true
  }

  close() {
    this.containerTarget.dataset.open = false
  }

  maybeClose(event) {
    if (event.target == this.backgroundTarget) {
      this.close()
    }
  }
}
