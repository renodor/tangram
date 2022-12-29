import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ['container']

  close() {
    this.containerTarget.dataset.open = false
  }

  open() {
    this.containerTarget.dataset.open = true
  }
}
