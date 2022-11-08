import { Controller } from "@hotwired/stimulus"
import { initAndPlay } from '../tangram/game'

export default class extends Controller {
  connect() {
    initAndPlay(this.element)
  }
}
