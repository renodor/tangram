import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ['container', 'background']

  open() {
    document.getElementById('nav').style.position = "static"
    this.containerTarget.dataset.open = true
  }

  close() {
    this.containerTarget.dataset.open = false
    document.getElementById('nav').style.position = "fixed"
  }

  maybeClose(event) {
    if (event.target == this.backgroundTarget) {
      this.close()
    }
  }
}
