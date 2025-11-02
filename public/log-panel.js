// public/log-panel.js
;(function () {
  function fmtDate(d = new Date()) {
    const pad = n => String(n).padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  class LogPanel {
    constructor(el) {
      this.el = el;
    }
    write(line) {
      const t = fmtDate();
      this.el.textContent += `[${t}] ${line}\n`;
      this.el.scrollTop = this.el.scrollHeight;
    }
    clear() { this.el.textContent = ""; }
  }

  window.LogPanel = LogPanel;
})();
