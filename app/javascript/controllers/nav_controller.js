import { Controller } from '@hotwired/stimulus'

export default class extends Controller {
  static targets = ['fullScreenTrigger']

  connect() {
    this.fullScreen = false
  }

  toggle() {
    this.fullScreen = !this.fullScreen;
    document.getElementById('patterns-menu').classList.toggle('removed');

    this.element.dataset.fullScreen = this.fullScreen;

    if (this.fullScreen) {
      const navWidth = this.element.offsetWidth;
      const elementWidth = this.fullScreenTriggerTarget.offsetWidth;
      const offset = navWidth - (elementWidth + 20);
      this.element.style.right = `-${offset}px`;
    } else {
      this.element.style.right = 0;
    }
  }
}
