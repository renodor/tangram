import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["currentPattern", "currentPatternSvg", "revealPattern", "pattern"]

  toggle() {
    this.element.classList.toggle('hidden')
  }

  changeCurrentPattern(event) {
    const newSelectedPattern = event.currentTarget
    const { id, solved } = newSelectedPattern.dataset

    this.currentSelectedPattern().dataset.selected = false
    newSelectedPattern.dataset.selected = true

    this.currentPatternTarget.dataset.id = id
    this.currentPatternTarget.dataset.solved = solved

    this.currentPatternSvgTarget.children[0].replaceWith(newSelectedPattern.children[0].cloneNode(true))

    this.dispatch('currentPatternChanged', {
      detail: {
        id: parseInt(id),
        solved: solved === 'true'
      }
    })
  }

  solveCurrentPattern() {
    fetch(`/patterns/${this.currentPatternTarget.dataset.id}/filled_svg`)
      .then((response) => response.text())
      .then((svgTag) => {
        this.currentPatternTarget.dataset.solved = true
        this.currentPatternSvgTarget.innerHTML = svgTag

        const currentSelectedPattern = this.currentSelectedPattern()
        currentSelectedPattern.dataset.solved = true
        currentSelectedPattern.innerHTML = svgTag
      })
  }

  async toggleRevealPattern() {
    if (this.currentPatternTarget.dataset.revealed === 'false') {
      this.currentPatternTarget.dataset.revealed = true
      const svgTag = await this.fetchPatternSvg('revealed')
      this.currentPatternSvgTarget.children[0].innerHTML = svgTag
    } else {
      this.currentPatternTarget.dataset.revealed = false
      fetch(`/patterns/${this.currentPatternTarget.dataset.id}/filled_svg`)
        .then((response) => response.text())
        .then((svgTag) => {
          this.currentPatternSvgTarget.children[0].innerHTML = svgTag
        })
    }
  }

  currentSelectedPattern() {
    return this.patternTargets.find((pattern) => pattern.dataset.selected === 'true')
  }

  async fetchPatternSvg(type) {
    return fetch(`/patterns/${this.currentPatternTarget.dataset.id}/${type}_svg`)
      .then((response) => response.text())
  }
}
