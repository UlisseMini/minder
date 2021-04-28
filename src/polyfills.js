if (Node.prototype.replaceChildren === undefined) {
  Node.prototype.replaceChildren = function (...nodes) {
    while (this.lastChild) {
      this.removeChild(this.lastChild)
    }

    this.append(...nodes)
  }
}

