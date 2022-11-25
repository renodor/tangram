import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["pattern", "currentPattern", "solvedPatterns"]

  toggle() {
    this.element.classList.toggle('hidden')
  }

  selectPattern(event) {
    const { id, imageUrl, solved } = event.currentTarget.dataset
    this.currentPatternTarget.dataset.id = id
    this.patternTargets.forEach((pattern) => pattern.classList.remove('current'))
    event.currentTarget.classList.add('current')

    const currentPattern = this.currentPatternTarget.querySelector('.pattern')
    currentPattern.innerHTML = `<img src="${imageUrl}">`
    if (solved === 'true') {
      currentPattern.classList.add('solved')
    } else {
      currentPattern.classList.remove('solved')
    }
  }
}
