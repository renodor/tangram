import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ['body']

  close() {
    this.element.dataset.open = false
  }

  open({ detail: { svgTag } }) {
    this.bodyTarget.innerHTML = svgTag
    this.element.dataset.open = true
  }
}
