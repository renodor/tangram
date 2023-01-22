import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["currentPattern", "currentPatternSvg", "revealPattern", "pattern"]

  toggle() {
    this.element.classList.toggle('hidden')
  }

  changeCurrentPattern(event) {
    const newSelectedPattern = event.type == 'winning-modal:continue' ? event.detail.pattern : event.currentTarget
    const { id, solved } = newSelectedPattern.dataset

    this.currentSelectedPattern().dataset.selected = false
    newSelectedPattern.dataset.selected = true

    this.currentPatternTarget.dataset.revealed = false
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

  solveCurrentPatternForTheFirstTime() {
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

  solveCurrentPattern() {
    this.currentPatternTarget.dataset.animated = true
    setTimeout(() => {
      this.currentPatternTarget.dataset.animated = false
    }, 1000);
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
