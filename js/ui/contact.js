// ============================================================
// CONTACT MODAL — Inquiry form & submission
// ============================================================
import { state } from '../state.js';
import { getRes, getRecESS } from '../logic/calculator.js';

export function openContact(model) {
  const pg = document.getElementById('cfProductGroup');
  const pp = document.getElementById('cfProductPreview');
  if (model) {
    document.getElementById('cfProduct').value = model;
    pg.style.display = '';
    if (pp) pp.style.display = 'none';
  } else {
    document.getElementById('cfProduct').value = '';
    pg.style.display = 'none';
    if (pp) pp.style.display = 'none';
  }
  document.getElementById('contactModal').classList.add('open');
}

export function closeContactModal() {
  document.getElementById('contactModal').classList.remove('open');
}

export function onModalBackdrop(e) {
  if (e.target === e.currentTarget) closeContactModal();
}

export function submitContactForm(e) {
  e.preventDefault();
  const btn = document.getElementById('submitBtn');
  btn.disabled = true; btn.textContent = 'Sending...';
  const fd = new FormData(document.getElementById('contactForm'));
  fetch('https://formspree.io/f/meebdrne', { method: 'POST', body: fd, headers: { 'Accept': 'application/json' } })
    .then(function(r) {
      btn.disabled = false; btn.textContent = 'Send Inquiry \u2192';
      if (r.ok) {
        if (typeof window.toast === 'function') window.toast('Inquiry sent! We will get back to you soon.', 'success');
        closeContactModal();
        document.getElementById('contactForm').reset();
      } else {
        if (typeof window.toast === 'function') window.toast('Failed to send. Please email support@powmr.com directly.', 'error');
      }
    })
    .catch(function() {
      btn.disabled = false; btn.textContent = 'Send Inquiry \u2192';
      if (typeof window.toast === 'function') window.toast('Network error. Please try again or email us directly.', 'error');
    });
}

export function submitCForm(e) {
  e.preventDefault();
  const r = getRes(), inv = r.inverter, bat = r.battery;
  const invM = inv.recommendedModels.map(function(m) { return m.model + (m.units > 1 ? ' x' + m.units : ''); }).join(', ') || 'N/A';
  const batM = bat.recommendedSolutions.map(function(s) { return s.model + ' x' + Math.max(1, Math.ceil(bat.requiredAh / s.ah)); }).join(', ') || 'N/A';
  const essRecs2 = getRecESS(inv, state.voltageStandard);
  const essM2 = essRecs2.length > 0 ? essRecs2.map(function(e) { return e.m; }).join(', ') : 'N/A';
  const sysSum = '--- System Configuration ---\nSystem Voltage: ' + inv.systemVoltage + 'V\nInverter: ' + (inv.inverterSize >= 1000 ? (inv.inverterSize / 1000).toFixed(1) + 'kW' : inv.inverterSize + 'W') + '\nBattery: ' + bat.batteryKwh.toFixed(1) + 'kWh (' + Math.round(bat.requiredAh) + 'Ah)\nRecommended Inverters: ' + invM + '\nRecommended Batteries: ' + batM + '\nRecommended ESS: ' + essM2 + '\nSystem Type: ' + state.systemType;
  const ss = document.getElementById('cSysSum'); if (ss) ss.value = sysSum;
  const btn = document.getElementById('cSubmitBtn');
  btn.disabled = true; btn.textContent = 'Sending...';
  const fd = new FormData(document.getElementById('cEndForm'));
  fetch('https://formspree.io/f/meebdrne', { method: 'POST', body: fd, headers: { 'Accept': 'application/json' } })
    .then(function(r) {
      btn.disabled = false; btn.textContent = 'Get My Quote \u2192';
      if (r.ok) {
        if (typeof window.toast === 'function') window.toast('Quote request sent! We will contact you soon.', 'success');
        document.getElementById('cEndForm').reset();
      } else {
        if (typeof window.toast === 'function') window.toast('Failed to send. Please email support@powmr.com directly.', 'error');
      }
    })
    .catch(function() {
      btn.disabled = false; btn.textContent = 'Get My Quote \u2192';
      if (typeof window.toast === 'function') window.toast('Network error. Please try again or email us directly.', 'error');
    });
}
