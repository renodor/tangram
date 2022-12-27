import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  close() {
    this.element.dataset.open = false
  }

  open() {
    this.element.dataset.open = true
  }
}
