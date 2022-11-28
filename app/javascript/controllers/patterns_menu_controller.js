import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["pattern", "currentPattern", "solvedPatterns"]

  toggle() {
    this.element.classList.toggle('hidden')
  }

  selectPattern(event) {
    const selectedPattern = event.currentTarget.querySelector('.pattern')
    const newCurrentPattern = selectedPattern.cloneNode(true)

    this.currentPatternTarget.dataset.id = selectedPattern.dataset.id
    this.patternTargets.forEach((pattern) => pattern.classList.remove('selected'))
    selectedPattern.classList.add('selected')

    newCurrentPattern.classList.add('current')
    this.currentPatternTarget.innerHTML = ''
    this.currentPatternTarget.appendChild(newCurrentPattern)
  }
}
