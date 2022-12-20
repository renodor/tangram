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

  closeAndContinue() {
    const nextNonSolvedPattern = document.querySelector('#patterns .pattern[data-solved=false]') || document.querySelector('#patterns .pattern')
    this.element.dataset.open = false
    this.dispatch('continue', {
      detail: {
        pattern: nextNonSolvedPattern
      }
    })
  }
}
