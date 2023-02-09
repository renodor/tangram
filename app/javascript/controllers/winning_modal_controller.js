import { Controller } from '@hotwired/stimulus'

export default class extends Controller {
  static targets = ['body', 'title', 'background']

  open({ detail: { svgTag, pun } }) {
    this.titleTarget.innerHTML = pun
    this.bodyTarget.innerHTML = svgTag
    this.element.dataset.open = true
  }

  close() {
    this.element.dataset.open = false
  }

  maybeClose(event) {
    if (event.target == this.backgroundTarget) {
      this.close()
    }
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
