/* js/features/alerts.js — Alertas dinámicas (amarilla y roja). */
"use strict";

/* ==========================================================================
   Sistema de alertas dinámicas (amarilla y roja)
   Ambas son avisos flotantes que NO bloquean la pantalla y se cierran solos.
   ========================================================================== */
const ALERT_MS = { yellow: 6500, red: 5000 };

let activeAlertTarget = null;
let lastAlertSignature = "";
const alertTimers = { yellow: null, red: null };

const alertEls = () => ({ yellow: $("alert-toast-yellow"), red: $("alert-toast-red") });

function hideAlert(level) {
  const el = alertEls()[level];
  clearTimeout(alertTimers[level]);
  if (el) el.classList.remove("on", "paused");
}

/* Muestra el aviso y lo oculta tras ALERT_MS. */
function showAlert(level, html) {
  const el = alertEls()[level];
  if (!el) return;

  hideAlert(level === "red" ? "yellow" : "red");

  el.innerHTML = html;
  el.style.setProperty("--alert-ms", ALERT_MS[level] + "ms");

  /* reinicia la barra de cuenta regresiva */
  el.classList.remove("on", "paused");
  void el.offsetWidth;
  el.classList.add("on");

  clearTimeout(alertTimers[level]);
  alertTimers[level] = setTimeout(() => hideAlert(level), ALERT_MS[level]);
}

function checkAndTriggerAlerts(force = false) {
  const al = Engine.alerts();

  if (!al.length) {
    lastAlertSignature = "";
    activeAlertTarget = null;
    hideAlert("yellow");
    hideAlert("red");
    return;
  }

  const redAlert = al.find(a => a.r.s === 2);
  const yellowAlert = al.find(a => a.r.s === 1);
  const target = redAlert || yellowAlert;

  const sig = `${S.crew}|${S.day}|${S.env}|${target.z.id}.${target.r.p.id}|${target.r.s}`;
  if (!force && sig === lastAlertSignature) return;
  lastAlertSignature = sig;

  if (redAlert) triggerRedAlert(redAlert);
  else triggerYellowAlert(yellowAlert);
}

const alertValue = a =>
  `${esc(a.z.n)} · ${esc(a.r.p.n)}: <span class="mono">${fmt(a.r.p, a.r.v)} ${esc(a.r.p.u)}</span>`;

function triggerYellowAlert(alertObj) {
  activeAlertTarget = alertObj;
  showAlert("yellow", `
    <div class="alert-head">
      <span>⚠ PRECAUCIÓN [NIVEL AMARILLO]</span>
      <span class="alert-go">Ir →</span>
    </div>
    <div class="alert-body">${alertValue(alertObj)}</div>
    <i class="alert-bar"></i>
  `);
}

function triggerRedAlert(alertObj) {
  activeAlertTarget = alertObj;
  showAlert("red", `
    <button type="button" class="alert-x" data-alert-close="red" aria-label="Descartar aviso">✕</button>
    <div class="alert-head">
      <span>[ ! ] ALERTA CRÍTICA</span>
      <span class="alert-go">Ir →</span>
    </div>
    <div class="alert-body">${alertValue(alertObj)}</div>
    <i class="alert-bar"></i>
  `);
}

/* Listener delegado: cerrar aviso, ir a la zona, y botón "Cerrar" del diálogo */
document.addEventListener("click", e => {
  const close = e.target.closest("[data-alert-close]");
  if (close) {
    e.stopPropagation();
    hideAlert(close.dataset.alertClose);
    return;
  }

  const toastEl = e.target.closest("#alert-toast-yellow, #alert-toast-red");
  if (toastEl && activeAlertTarget) {
    const t = activeAlertTarget;
    hideAlert("yellow");
    hideAlert("red");
    activeAlertTarget = null;
    Nav.go({ tab: t.z.tab, z: t.z.id, p: t.r.p.id });
    return;
  }

  if (e.target.closest("[data-dlg-close]")) dlg.close();
});

/* Pausa la cuenta regresiva mientras el cursor o el foco están sobre el aviso */
["yellow", "red"].forEach(level => {
  const el = alertEls()[level];
  if (!el) return;
  const pause = () => {
    clearTimeout(alertTimers[level]);
    el.classList.add("paused");
  };
  const resume = () => {
    if (!el.classList.contains("on")) return;
    el.classList.remove("paused");
    alertTimers[level] = setTimeout(() => hideAlert(level), 2000);
  };
  el.addEventListener("mouseenter", pause);
  el.addEventListener("mouseleave", resume);
  el.addEventListener("focusin", pause);
  el.addEventListener("focusout", resume);
});

addEventListener("keydown", e => {
  if (e.key === "Escape") {
    hideAlert("red");
    hideAlert("yellow");
  }
});
