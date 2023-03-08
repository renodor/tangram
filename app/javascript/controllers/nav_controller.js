import { Controller } from '@hotwired/stimulus'

export default class extends Controller {
  static targets = ['fullScreenTrigger']

  connect() {
    this.fullScreen = false
  }

  toggle() {
    if (this.fullScreen) {
      this.exitFullScreen()
    } else {
      this.enterFullScreen()
    }
  }

  enterFullScreen() {
    this.fullScreen = true
    this.element.dataset.fullScreen = this.fullScreen;
    document.getElementById('patterns-menu').classList.add('removed');
    const navWidth = this.element.offsetWidth;
    const elementWidth = this.fullScreenTriggerTarget.offsetWidth;
    const offset = navWidth - (elementWidth + 20);
    this.element.style.right = `-${offset}px`;
  }

  exitFullScreen() {
    this.fullScreen = false
    this.element.dataset.fullScreen = this.fullScreen;
    document.getElementById('patterns-menu').classList.remove('removed');
    this.element.style.right = 0;
  }
}
