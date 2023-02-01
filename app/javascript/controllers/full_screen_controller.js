import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  toggle() {
    document.getElementById("patterns-menu").classList.toggle("removed");
    document.getElementById("nav").classList.toggle("small");
    this.element.classList.toggle("enabled");
  }
}
