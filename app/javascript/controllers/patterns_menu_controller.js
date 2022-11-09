import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["pattern", "currentPattern"]
  toggle() {
    this.element.classList.toggle('hidden')
  }

  selectPattern(event) {
    const { id, name } = event.currentTarget.dataset
    this.currentPatternTarget.dataset.id = id
    this.patternTargets.forEach((pattern) => pattern.classList.remove('current'))
    event.currentTarget.classList.add('current')
    this.currentPatternTarget.querySelector('.pattern').innerHTML = name
  }
}
