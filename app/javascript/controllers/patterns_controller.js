import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["currentPattern", "patternSvg", "revealPattern", "pattern"]

  toggle() {
    this.element.classList.toggle('hidden')
  }

  selectPattern(event) {
    const selectedPattern = event.currentTarget
    const { id, solved } = selectedPattern.dataset

    this.dispatch('currentPatternChanged', {
      detail: {
        id: parseInt(id),
        solved: solved === 'true'
      }
    })

    this.currentPatternTarget.dataset.id = id
    this.currentPatternTarget.dataset.solved = solved

    this.patternTargets.forEach((pattern) => pattern.dataset.selected = false)
    selectedPattern.dataset.selected = true

    this.patternSvgTarget.innerHTML = ''
    this.patternSvgTarget.appendChild(selectedPattern.querySelector('svg').cloneNode(true))
  }

  solveCurrentPattern() {
    fetch(`/patterns/${this.currentPatternTarget.dataset.id}/filled_svg`)
      .then((response) => response.text())
      .then((svgTag) => {
        this.patternSvgTarget.innerHTML = svgTag
        const selectedPattern = this.patternTargets.find((pattern) => pattern.dataset.selected === "true")
        selectedPattern.innerHTML = svgTag
        selectedPattern.dataset.solved = true
      })
  }

  revealPattern() {
    if (this.currentPatternTarget.dataset.revealed === 'false') {
      this.currentPatternTarget.dataset.revealed = true
      fetch(`/patterns/${this.currentPatternTarget.dataset.id}/revealed_svg`)
        .then((response) => response.text())
        .then((svgTag) => {
          this.patternSvgTarget.children[0].classList.add('display-none')
          this.patternSvgTarget.insertAdjacentHTML('afterbegin', svgTag)

          this.revealPatternTarget.querySelector('.eye').classList.add('display-none')
          this.revealPatternTarget.querySelector('.eye-crossed').classList.remove('display-none')
        })
    } else {
      this.currentPatternTarget.dataset.revealed = false
      this.patternSvgTarget.children[0].remove()
      this.patternSvgTarget.children[0].classList.remove('display-none')

      this.revealPatternTarget.querySelector('.eye-crossed').classList.add('display-none')
      this.revealPatternTarget.querySelector('.eye').classList.remove('display-none')
    }
  }
}
