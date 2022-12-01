import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ['body']

  close() {
    this.element.classList.add('display-none')
  }

  open({ detail: { svgTag } }) {
    this.bodyTarget.innerHTML = svgTag
    this.element.classList.remove('display-none')
  }
}
