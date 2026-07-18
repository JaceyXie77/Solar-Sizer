// ============================================================
// WIZARD — C-end system sizing wizard (Steps 1–4)
// ============================================================
import { state } from '../state.js';
import { genId, getRes, gTRP, getAllItems, getRecESS, calcInv } from '../logic/calculator.js';
import { getVoltageRangeSimple, getVoltageSelectSimple, getVoltageGuideText } from '../logic/voltage.js';
import { esc } from '../utils/helpers.js';
import { getUrlByModel, findProductAny, findProductCat } from '../utils/helpers.js';
import { folderUrl, getManualUrl, MANUAL_TREE } from '../logic/manuals.js';
import { LOAD_PRESETS, PRESET_OPTIONS, STEP_TITLES, QUICK_APPLIANCES, QUICK_MP_APPLIANCES, VOLTAGE_LABELS, BACKUP_OPTIONS, SYSTEM_TYPES, MULTI_PHASE_VOLTAGES, PHASE_COUNT, COMMON_TIMEZONES } from '../data/presets.js';

// ──── cCardBtns helper (used in wizard rendering) ────
function cCardBtns(model) {
  const url = getUrlByModel(model);
  var p = findProductAny(model), cat = p ? findProductCat(model) : null;
  var manualUrl = p && cat ? getManualUrl(cat, p) : folderUrl(MANUAL_TREE._id);
  return '<div class="c-card-actions">' + (url ? '<a href="' + url + '" target="_blank" rel="noopener" class="c-btn-sm c-btn-product">Product Page</a>' : '<span class="c-btn-sm c-btn-disabled">Coming Soon</span>') + '<a href="' + manualUrl + '" target="_blank" rel="noopener" class="c-btn-sm c-btn-manual">Manual</a></div>';
}

// ──── Render helpers ────
function rC(ic, lb, v, un, cc, ac) {
  const icns = {
    zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    trending: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
    battery: '<rect x="1" y="6" width="18" height="12" rx="2" ry="2"/><line x1="23" y1="13" x2="23" y2="11"/>',
    cpu: '<rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>',
    'battery-charging': '<path d="M15 7h1a2 2 0 012 2v6a2 2 0 01-2 2h-2"/><path d="M6 7H4a2 2 0 00-2 2v6a2 2 0 002 2h1"/><polyline points="11 7 8 12 12 12 9 17"/><line x1="22" y1="11" x2="22" y2="13"/>',
    lightbulb: '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0018 8 6 6 0 006 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 018.91 14"/>',
    package: '<path d="M16.5 9.4L7.55 4.24"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>'
  };
  return '<div class="result-card">' + (ac ? '<div class="accent-shape"></div>' : '') + '<div class="card-content"><div class="card-icon ' + cc + '"><svg class="icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' + (icns[ic] || icns.zap) + '</svg></div><div><p class="card-label">' + lb + '</p><p class="card-value">' + v + '</p><p class="card-unit">' + un + '</p></div></div></div>';
}

// ──── Step Indicator ────
export function renderSI() {
  const d = document.getElementById('stepDesktop'), m = document.getElementById('stepMobile'), p = document.getElementById('stepProgress');
  const st = [1, 2, 3, 4], lb = STEP_TITLES;
  d.querySelectorAll('.step-item').forEach(function(e) { e.remove(); });
  m.innerHTML = '';
  st.forEach(function(s, i) {
    const c = state.currentStep > s, cur = state.currentStep === s, f = state.currentStep < s;
    const div = document.createElement('div');
    div.className = 'step-item';
    div.onclick = function() { if (!f) goTS(s); };
    div.innerHTML = '<div class="step-circle ' + (c ? 'completed' : cur ? 'current' : 'future') + '">' + (c ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : cur ? '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>' : '<span>' + s + '</span>') + '</div><span class="step-label ' + (c || cur ? 'active' : 'inactive') + '">' + lb[i] + '</span>';
    d.appendChild(div);
  });
  d.appendChild(p);
  st.forEach(function(s, i) {
    const c = state.currentStep > s, cur = state.currentStep === s;
    const dd = document.createElement('div');
    dd.className = 'step-item';
    dd.innerHTML = '<div class="step-circle ' + (c ? 'completed' : cur ? 'current' : 'future') + '">' + (c ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : s) + '</div>';
    m.appendChild(dd);
  });
  // Mobile progress line
  var mpEl = document.createElement('div');
  mpEl.className = 'step-mobile-progress';
  var pct = state.currentStep <= 1 ? 0 : Math.round((state.currentStep - 1) / (st.length - 1) * 100);
  mpEl.style.width = pct + '%';
  m.appendChild(mpEl);
  const items = d.querySelectorAll('.step-item'), cs = state.currentStep, tgtIdx = cs - 1;
  if (items.length > 1 && tgtIdx >= 1 && tgtIdx < items.length) {
    var c0 = items[0].offsetLeft + items[0].offsetWidth / 2;
    var ct = items[tgtIdx].offsetLeft + items[tgtIdx].offsetWidth / 2;
    p.style.left = c0 + 'px'; p.style.width = (ct - c0) + 'px';
  } else { p.style.left = '0px'; p.style.width = '0px'; }
}

// ──── Main Render ────
export function renderWiz() {
  const r = getRes();
  renderSI();
  renderCont(r);
}

export function renderCont(r) {
  const area = document.getElementById('contentArea');
  area.className = 'container content-card';
  const inv = r.inverter, bat = r.battery, trp = inv.totalRunningPower, s = state.currentStep;
  let h = '<a class="back-link mb-4" onclick="goL()" style="display:inline-block">\u2190 Back to Home</a><div class="step-title"><span class="step-badge">' + s + '</span><h2>' + STEP_TITLES[s - 1] + '</h2></div>';
  try { if (s === 1) h += rendS1(trp); } catch(e) { h += '<div class="warning-box"><p>Error rendering Step 1. Please try again.</p></div>'; console.error('rendS1 error:', e); }
  try { if (s === 2) h += rendS2(inv); } catch(e) { h += '<div class="warning-box"><p>Error rendering Step 2. Please try again.</p></div>'; console.error('rendS2 error:', e); }
  try { if (s === 3) h += rendS3(bat); } catch(e) { h += '<div class="warning-box"><p>Error rendering Step 3. Please try again.</p></div>'; console.error('rendS3 error:', e); }
  try { if (s === 4) h += rendS4(inv, bat); } catch(e) { h += '<div class="warning-box"><p>Error rendering Step 4. Please try again.</p></div>'; console.error('rendS4 error:', e); }
  h += '<div class="nav-buttons"><div class="flex gap-2">' + (s > 1 ? '<button class="btn" onclick="prevS()"><svg class="icon-md mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>Previous</button>' : '') + '</div><div class="flex gap-2"><button class="btn btn-ghost btn-sm" onclick="resetToStep1()"><svg class="icon-sm mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>Reset</button>' + (s < 4 ? '<button class="btn btn-primary" onclick="nextS()">Next<svg class="icon-md ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></button>' : '') + '</div></div>';
  area.innerHTML = h;
}

// ──── Step 1: Load Input ────
function rendS1(trp) {
  const it = state.loadItems, hsp = it.length > 0;
  const sr = gTRP(it), mr = gTRP(state.multiPhaseItems), ct = gTRP(getAllItems());
  const mv = MULTI_PHASE_VOLTAGES[state.voltageStandard] || [];
  let h = '<div class="space-y-6">';
  h += '<div class="flex flex-wrap items-center gap-4 wiz-s1-row"><label class="whitespace-nowrap">What do you want to power?</label><select onchange="appP(this.value)"><option value="" disabled selected>Select one</option>' + PRESET_OPTIONS.map(function(o) { return '<option value="' + o.value + '" ' + (state.currentPreset === o.value ? 'selected' : '') + '>' + o.label + '</option>'; }).join('') + '</select></div>';
  h += '<div class="flex flex-wrap items-center gap-4 wiz-s1-row"><label class="whitespace-nowrap">Voltage Standard</label><select onchange="setVS(this.value)">' + Object.entries(VOLTAGE_LABELS).map(function(kv) { return '<option value="' + kv[0] + '" ' + (state.voltageStandard === kv[0] ? 'selected' : '') + '>' + kv[1] + '</option>'; }).join('') + '</select></div>';
  h += rendLT('Single-phase Appliances', it, true);
  h += '<div class="flex items-center justify-between wiz-s1-actions"><button class="btn btn-sm" onclick="addLI()"><svg class="icon-md mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add Appliance</button><div class="total-badge">' + tBG(sr, 'Single-phase Total') + '</div></div>';
  h += '<div class="preset-label">Quick Add:</div><div class="preset-chips">' + QUICK_APPLIANCES.map(function(a) { return '<span class="preset-chip" onclick="qAdd(\'' + a.name + '\',' + a.power + ',' + a.hoursPerDay + ',' + a.surge + ',' + a.running + ')">' + a.name + ' <span class="chip-watts">' + (a.power >= 1000 ? (a.power / 1000).toFixed(1) + 'kW' : a.power + 'W') + '</span></span>'; }).join('') + '</div>';
  if (mv.length) {
    const se = state.showMultiPhase;
    h += '<div class="multi-phase-section"><button class="btn btn-sm mp-toggle" onclick="togMP()">' + (se ? '<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 15 12 9 18 15"/></svg>' : '<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>') + (se ? 'Hide Split-phase / 3-Phase' : 'Add Split-phase / 3-Phase Appliances') + '</button>';
    if (se) {
      h += '<div class="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200"><label class="text-sm font-medium text-slate-700 mr-4">Multi-phase Voltage</label><select onchange="setMPV(this.value)">' + mv.map(function(v) { return '<option value="' + v.value + '" ' + (state.multiPhaseVoltage === v.value ? 'selected' : '') + '>' + v.label + '</option>'; }).join('') + '</select><span class="text-xs text-slate-400 ml-3">' + gMPH(state.multiPhaseVoltage) + '</span></div>';
      h += rendLT('Split-phase / 3-Phase Appliances', state.multiPhaseItems, false);
      h += '<div class="flex items-center justify-between wiz-s1-actions"><button class="btn btn-sm" onclick="addMPI()"><svg class="icon-md mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add Multi-phase Appliance</button><div class="total-badge">' + tBG(mr, 'Multi-phase Total') + '</div></div>';
      h += '<div class="preset-label">Quick Add:</div><div class="preset-chips">' + QUICK_MP_APPLIANCES.map(function(a) { return '<span class="preset-chip" onclick="qAddMP(\'' + a.name + '\',' + a.power + ',' + a.hoursPerDay + ',' + a.surge + ',' + a.running + ')">' + a.name + ' <span class="chip-watts">' + (a.power >= 1000 ? (a.power / 1000).toFixed(1) + 'kW' : a.power + 'W') + '</span></span>'; }).join('') + '</div>';
    }
    h += '</div>';
  }
  if (hsp || state.multiPhaseItems.length) { h += '<div class="flex justify-end mt-4"><div class="total-badge text-lg" style="padding:10px 20px;">' + tBG(ct, 'System Total Power') + '</div></div>'; }
  h += '</div>';
  return h;
}

function rendLT(ti, it, sp) {
  if (!it.length) return '<div class="empty-state"><p class="text-sm text-slate-400">' + ti + ' \u2014 No appliances added yet</p></div>';
  let h = '<div class="table-wrap"><table><thead><tr><th>Appliance</th><th class="center w-24">Power (W)</th><th class="center w-24">Qty</th><th class="center w-32">Running <span class="help-badge" title="Running: Always-on loads like fridge, router. Counted at 100% power continuously.">?</span></th><th class="center w-24">Hours/Day</th><th class="center w-32">Surge <span class="help-badge" title="Surge: Motor-start loads like pump, AC. Peak power = surge\u00d72 + non-surge\u00d71.2">?</span></th><th class="w-24"></th></tr></thead><tbody>';
  it.forEach(function(it) {
    h += '<tr><td><input type="text" value="' + esc(it.name) + '" placeholder="Appliance name" onchange="updIt(\'' + it.id + '\',\'name\',this.value)"></td><td><input type="number" min="0" value="' + it.power + '" onchange="updIt(\'' + it.id + '\',\'power\',Number(this.value)||0)"></td><td><input type="number" min="1" value="' + it.qty + '" onchange="updIt(\'' + it.id + '\',\'qty\',Number(this.value)||1)"></td><td><div class="toggle-wrap"><label class="toggle"><input type="checkbox" ' + (it.running ? 'checked' : '') + ' onchange="updIt(\'' + it.id + '\',\'running\',this.checked)"><span class="toggle-slider"></span></label><span class="toggle-label">' + (it.running ? 'Y' : 'N') + '</span></div></td><td><input type="number" min="0" max="24" step="0.5" value="' + it.hoursPerDay + '" onchange="updIt(\'' + it.id + '\',\'hoursPerDay\',Number(this.value)||0)"></td><td><div class="toggle-wrap"><label class="toggle"><input type="checkbox" ' + (it.surge ? 'checked' : '') + ' onchange="updIt(\'' + it.id + '\',\'surge\',this.checked)"><span class="toggle-slider"></span></label><span class="toggle-label">' + (it.surge ? 'Y' : 'N') + '</span></div></td><td><button class="btn btn-icon" onclick="rmIt(\'' + it.id + '\')"><svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button></td></tr>';
  });
  h += '</tbody></table></div>';
  return h;
}

function tBG(w, l) {
  return '<span class="label">' + l + ':</span><span class="value">' + w.toLocaleString() + '</span><span>W</span>';
}

function gMPH(v) {
  if (!v) return 'Select multi-phase voltage type';
  const p = PHASE_COUNT[v] || 0;
  if (p === 2) return 'Split-phase 240V: two 120V legs';
  if (p === 3) return '3-Phase: single-phase loads reduce capacity on the weakest leg';
  return '';
}

// ──── Step 2: Inverter ────
function rendS2(inv) {
  const svRange = getVoltageRangeSimple(inv.peakPower);
  const ip = inv.recommendedModels.length > 0 && inv.recommendedModels[0].units > 1;
  const tpeu = inv.threePhaseEU;
  let h = '<div class="space-y-6"><div><h2 class="text-xl font-bold">Choose Your Inverter</h2><p class="text-sm text-slate-500 mt-2">Automatically calculated from your load inputs' + (ip ? ' \u2014 Parallel mode active' : '') + (tpeu ? ' \u2014 Three-phase (parallel config required, no single three-phase inverter)' : '') + '</p></div><div class="card-grid s2-summary">';
  h += rC('zap', 'Total Running Power', Math.round(inv.totalRunningPower).toLocaleString(), 'W', 'orange-soft');
  h += rC('trending', 'Peak Power', Math.round(inv.peakPower).toLocaleString(), 'W (surge \u00d72 / non-surge \u00d71.2)', 'orange', true);
  h += rC('battery', 'System Voltage', svRange, '', 'blue');
  h += '</div>';
  if (inv.recommendedModels.length) {
    const si = ip ? '<svg class="icon-md text-orange-600 inline mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2"/><line x1="12" y1="2" x2="12" y2="22"/></svg>' : '<svg class="icon-md text-orange-600 inline mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>';
    h += '<div class="space-y-3"><h3 class="text-sm font-semibold text-slate-700">' + si + (ip ? 'Recommended Parallel Configurations (cost-optimized)' : 'Recommended Inverter Models') + '</h3><div class="card-grid">';
    inv.recommendedModels.forEach(function(m, idx) {
      const pwT = m.totalRatedPower >= 1000 ? (m.totalRatedPower / 1000).toFixed(1) + 'kW' : m.totalRatedPower + 'W';
      const ui = m.units > 1 ? ' x ' + m.units + ' units = ' + pwT : '';
      const bb = idx === 0 ? ' <span class="badge badge-orange ml-2">Best</span>' : '';
      const excT = m.excess !== undefined ? (m.excess >= 1000 ? (m.excess / 1000).toFixed(1) + 'kW' : m.excess + 'W') : '';
      const excessRatio = m.excess !== undefined && inv.peakPower > 0 ? (m.excess / inv.peakPower) : 0;
      h += '<div class="model-card"><p class="model-name">' + m.model + bb + '</p><p class="model-spec">Unit rating: ' + m.ratedPower.toLocaleString() + 'W' + (m.parallelCapable ? ' <span class="badge badge-orange ml-2">Parallel</span>' : '') + '</p>' + (ui ? '<p class="text-sm text-orange-600 font-medium mt-2">' + ui + '</p>' : '') + (m.excess !== undefined ? '<p class="text-xs text-slate-400 mt-1">Headroom: ' + excT + ' (' + (excessRatio * 100).toFixed(1) + '%)</p>' : '') + cCardBtns(m.model) + '</div>';
    });
    h += '</div></div>';
  } else {
    h += '<div class="warning-box">No recommended models for this power range.</div>';
  }
  h += '<div class="info-box"><p>\u2022 Peak Power: Surge loads \u00d72 + Non-surge \u00d71.2 (or Total \u00d71.2)</p><p>\u2022 ' + getVoltageGuideText(state.voltageStandard) + '</p></div></div>';
  return h;
}

// ──── Step 3: Battery ────
function rendS3(bat) {
  const ic = ![4, 8, 12, 24].includes(state.backupTime);
  const sv = ic ? 'custom' : String(state.backupTime);
  let h = '<div class="space-y-6"><div><h2 class="text-xl font-bold">Choose Your Battery</h2><p class="text-sm text-slate-500 mt-2">Automatically calculated based on backup time</p></div><div class="flex items-center gap-4"><label class="whitespace-nowrap">Backup Time</label><select onchange="hdlBC(this.value)">' + BACKUP_OPTIONS.map(function(o) { return '<option value="' + o.value + '" ' + (sv === o.value ? 'selected' : '') + '>' + o.label + '</option>'; }).join('') + '</select>' + (ic ? '<input type="number" min="1" max="48" value="' + state.backupTime + '" onchange="setBT(Number(this.value)||1)">' : '') + '</div><div class="card-grid">';
  h += rC('battery', 'Daily Energy', Math.round(bat.dailyEnergyWh).toLocaleString(), 'Wh/day', 'blue');
  h += rC('battery-charging', 'Backup Energy', Math.round(bat.backupEnergyWh).toLocaleString(), 'Wh (' + state.backupTime + 'h)', 'orange', true);
  h += rC('lightbulb', 'Recommended', bat.batteryKwh.toFixed(1), 'kWh (DoD & efficiency)', 'blue');
  h += rC('package', 'Required Capacity', Math.round(bat.requiredAh).toLocaleString(), 'Ah', 'orange', true);
  h += '</div>';
  if (bat.recommendedSolutions.length) {
    h += '<div class="space-y-3"><h3 class="text-sm font-semibold text-slate-700">Recommended Batteries</h3><div class="card-grid">';
    bat.recommendedSolutions.forEach(function(s) {
      const u = Math.max(1, Math.ceil(bat.requiredAh / s.ah)), st = s.series || 1, total = u * st;
      const totalKwh = (u * s.ah * s.voltage / 1000);
      const margin = bat.batteryKwh > 0 ? ((totalKwh - bat.batteryKwh) / bat.batteryKwh * 100).toFixed(0) : 0;
      h += '<div class="model-card"><p class="model-name">' + (s.displayModel || s.model) + '</p><p class="model-spec">' + s.ah + 'Ah / ' + s.voltage + 'V' + (s.type ? ' \u00b7 ' + s.type : '') + '</p>' + (s.series ? '<p class="text-sm text-orange-600 font-medium mt-2">' + s.series + 'S \u00d7 ' + u + 'P = ' + total + ' batteries needed \u00b7 <span class="text-slate-400">Max ' + s.series + 'S' + s.maxParallel + 'P \u2192 ' + s.maxParallel * st + ' batteries</span></p>' : '<p class="text-sm text-orange-600 font-medium mt-2">' + u + ' unit' + (u > 1 ? 's' : '') + ' in parallel \u00b7 <span class="text-slate-400">Max ' + s.maxParallel + 'P</span></p>') + '<p class="text-xs text-green-600 font-medium mt-1">Total: ' + totalKwh.toFixed(1) + ' kWh \u00b7 <span class="text-slate-500">Headroom: +' + margin + '%</span></p>' + cCardBtns(s.model) + '</div>';
    });
    h += '</div></div>';
  } else if (bat.requiredAh > 0) {
    h += '<div class="warning-box"><p>You need a <strong>' + Math.round(bat.requiredAh).toLocaleString() + 'Ah</strong> battery bank. Contact PowMr for custom solutions.</p></div>';
  }
  h += '<div class="info-box"><p>\u2022 Daily = \u03a3(power \u00d7 qty \u00d7 hrs/day) \u2022 Backup = Daily \u00d7 (hrs/24)</p><p>\u2022 DoD 80% \u00b7 Efficiency 90%</p></div></div>';
  return h;
}

// ──── Step 4: Summary ────
function rendS4(inv, bat) {
  let h = '<div class="space-y-6"><div><h2 class="text-xl font-bold">Your Complete System</h2></div><div class="summary-card"><div class="accent-shape"></div><div class="summary-title"><svg class="icon-lg text-orange-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>Configuration Summary</div><div class="summary-grid mt-4"><div class="summary-item orange"><p class="summary-item-label">System Voltage</p><p class="summary-item-value text-orange-700">' + inv.systemVoltage + 'V</p></div><div class="summary-item orange"><p class="summary-item-label">Inverter System</p><p class="summary-item-value text-orange-700">' + (inv.inverterSize >= 1000 ? (inv.inverterSize / 1000).toFixed(1) + 'kW' : inv.inverterSize + 'W') + (inv.isParallel ? ' <span style="font-size:14px;font-weight:500">(Parallel)</span>' : '') + '</p></div><div class="summary-item green"><p class="summary-item-label">Battery Storage System</p><p class="summary-item-value text-green-700">' + bat.batteryKwh.toFixed(1) + 'kWh</p><p class="summary-item-sublabel">' + Math.round(bat.requiredAh) + 'Ah</p></div></div></div>';
  h += '<div class="space-y-3"><h3 class="text-sm font-semibold text-slate-700 mb-3">Products</h3>';
  if (inv.recommendedModels.length) {
    h += '<div class="space-y-2 mb-4"><h4 class="text-xs font-medium text-slate-500 uppercase tracking-wider">\u26a1 Inverters</h4><div class="card-grid">';
    inv.recommendedModels.forEach(function(m) {
      const pwT2 = m.totalRatedPower >= 1000 ? (m.totalRatedPower / 1000).toFixed(1) + 'kW' : m.totalRatedPower + 'W';
      const ui = m.units > 1 ? m.units + ' units = ' + pwT2 : '<span class="text-green-700">Single unit</span>';
      h += '<div class="model-card p-4"><div class="flex items-start justify-between"><div><p class="model-name">' + m.model + '</p><p class="model-spec">' + m.ratedPower.toLocaleString() + 'W / ' + inv.systemVoltage + 'V' + (m.parallelCapable ? ' <span class="badge badge-orange ml-2">Parallel</span>' : '') + '</p><p class="text-sm text-orange-600 font-medium mt-2">' + ui + '</p></div><span class="badge badge-orange shrink-0 ml-2">\u2713</span></div>' + cCardBtns(m.model) + '</div>';
    });
    h += '</div></div>';
  }
  if (bat.recommendedSolutions.length) {
    h += '<div class="space-y-2"><h4 class="text-xs font-medium text-slate-500 uppercase tracking-wider">\uD83D\uDD0C Batteries</h4><div class="card-grid">';
    bat.recommendedSolutions.forEach(function(s) {
      const u = Math.max(1, Math.ceil(bat.requiredAh / s.ah)), st = s.series || 1, total = u * st;
      const totalKwh = (u * s.ah * s.voltage / 1000);
      const margin = bat.batteryKwh > 0 ? ((totalKwh - bat.batteryKwh) / bat.batteryKwh * 100).toFixed(0) : 0;
      h += '<div class="model-card p-4"><div class="flex items-start justify-between"><div><p class="model-name">' + (s.displayModel || s.model) + '</p><p class="model-spec">' + s.ah + 'Ah / ' + s.voltage + 'V' + (s.type ? ' \u00b7 ' + s.type : '') + ' <span class="text-orange-600 font-semibold ml-1">\u2192 ' + (s.series ? s.series + 'S \u00d7 ' + u + 'P = ' + total + ' batteries (Max: ' + s.series + 'S' + s.maxParallel + 'P = ' + s.maxParallel * st + ' batteries)' : u + ' unit' + (u > 1 ? 's' : '') + ' (Max: ' + s.maxParallel + 'P)') + '</span></p><p class="text-xs text-green-600 font-medium mt-1">Total: ' + totalKwh.toFixed(1) + ' kWh \u00b7 <span class="text-slate-500">Headroom: +' + margin + '%</span></p></div><span class="badge badge-orange shrink-0 ml-2">\u2713</span></div>' + cCardBtns(s.model) + '</div>';
    });
    h += '</div></div>';
  }
  h += '</div>';
  // ESS Recommendation
  var essRecs = getRecESS(inv, state.voltageStandard);
  if (essRecs.length > 0) {
    h += '<div class="space-y-2"><h4 class="text-xs font-medium text-slate-500 uppercase tracking-wider">\uD83C\uDFE0 Energy Storage System (All-in-One)</h4><p class="ess-hint">One unit covers it all \u2014 inverter and battery in a single system. No separate purchases needed.</p><div class="card-grid">';
    essRecs.forEach(function(e) {
      var pwDisplay = e.rp >= 1000 ? (e.rp / 1000).toFixed(1) + 'kW' : e.rp + 'W';
      var bcDisplay = e.bc || '';
      h += '<div class="model-card p-4"><div class="flex items-start justify-between"><div><p class="model-name">' + e.m + '</p><p class="model-spec">' + pwDisplay + ' / ' + e.ov + ' / ' + e.sv + (bcDisplay ? '<br>Battery: ' + bcDisplay : '') + '</p><p class="model-spec text-xs text-slate-400 mt-1">PV Input: ' + (e.pv || 'N/A') + ' \u00b7 VOC: ' + (e.voc || 'N/A') + ' \u00b7 ' + (e.sz || '') + ' \u00b7 ' + (e.wt || '') + '</p></div><span class="badge badge-green shrink-0 ml-2">All-in-One</span></div>' + cCardBtns(e.m) + '</div>';
    });
    h += '</div></div>';
  }

  const invModels = inv.recommendedModels.map(function(m) { return m.model + (m.units > 1 ? ' x' + m.units : ''); }).join(', ') || 'N/A';
  const batModels = bat.recommendedSolutions.map(function(s) { const u = Math.max(1, Math.ceil(bat.requiredAh / s.ah)); return (s.displayModel || s.model) + ' x' + u + (s.series ? ' strings (' + (u * s.series) + ' total)' : ''); }).join(', ') || 'N/A';
  h += '<div class="quote-card mt-2"><div class="quote-title"><svg class="icon-lg text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>Request a Quote for Your System</div><p class="quote-desc">Our team will recommend the best pricing and setup based on your configuration above.</p><form id="cEndForm" onsubmit="submitCForm(event)" action="https://formspree.io/f/meebdrne" method="POST"><div class="form-row"><div class="form-group"><label>Name *</label><input type="text" name="name" placeholder="Your name" required></div><div class="form-group"><label>E-mail *</label><input type="email" name="email" placeholder="your@email.com" required></div></div><div class="form-row"><div class="form-group"><label>Country</label><input type="text" name="country" placeholder="Your country"></div><div class="form-group"><label>WhatsApp / Phone</label><input type="tel" name="phone" placeholder="+xx xxx xxxx"></div></div><div class="form-group"><label>Additional Notes</label><textarea name="message" placeholder="Any specific requirements or questions..."></textarea></div><input type="hidden" name="_subject" value="C-End System Sizer - Quote Request"><input type="hidden" name="system_summary" id="cSysSum" value=""><button type="submit" class="submit-btn" id="cSubmitBtn">Get My Quote \u2192</button></form></div>';
  h += '<div class="flex flex-wrap gap-3 pt-2" style="flex-direction:row"><button class="btn btn-blue btn-lg" style="flex:1;min-width:200px" onclick="window.open(\'https://www.powmr.com\',\'_blank\')">View Products on PowMr.com</button><button class="btn btn-lg" style="flex:1;min-width:200px" onclick="dlR()">Download Result</button></div><div class="flex flex-wrap items-center gap-4 pt-3 text-sm text-slate-500" style="width:100%"><label class="whitespace-nowrap">Report Timezone:</label><select onchange="state.timezone=this.value" class="select-sm">' + COMMON_TIMEZONES.map(function(tz) { return '<option value="' + tz.value + '" ' + (state.timezone === tz.value ? 'selected' : '') + '>' + tz.label + '</option>'; }).join('') + '</select></div></div>';
  return h;
}

// ──── Wizard Actions ────
export function appP(k) {
  if (!k) return;
  state.loadItems = JSON.parse(JSON.stringify(LOAD_PRESETS[k] || []));
  state.currentPreset = k;
  state.currentStep = 1;
  state.multiPhaseItems = [];
  state.showMultiPhase = false;
  state.multiPhaseVoltage = null;
  if (typeof window.renderAll === 'function') window.renderAll();
}

export function setVS(v) {
  state.voltageStandard = v;
  state.multiPhaseVoltage = null;
  state.showMultiPhase = false;
  state.multiPhaseItems = [];
  if (typeof window.renderAll === 'function') window.renderAll();
}

export function addLI() {
  state.loadItems.push({ id: genId(), name: '', power: 0, qty: 1, running: true, hoursPerDay: 4, surge: false });
  if (typeof window.renderAll === 'function') window.renderAll();
}

export function rmIt(id) {
  state.loadItems = state.loadItems.filter(function(i) { return i.id !== id; });
  state.multiPhaseItems = state.multiPhaseItems.filter(function(i) { return i.id !== id; });
  state.currentPreset = 'custom';
  if (typeof window.renderAll === 'function') window.renderAll();
}

export function updIt(id, k, val) {
  let it = state.loadItems.find(function(i) { return i.id === id; });
  if (!it) it = state.multiPhaseItems.find(function(i) { return i.id === id; });
  if (it) {
    it[k] = val;
    state.currentPreset = 'custom';
    if (typeof window.renderAll === 'function') window.renderAll();
  }
}

export function togMP() {
  state.showMultiPhase = !state.showMultiPhase;
  if (state.showMultiPhase && !state.multiPhaseVoltage) {
    const mv = MULTI_PHASE_VOLTAGES[state.voltageStandard] || [];
    if (mv.length) state.multiPhaseVoltage = mv[0].value;
  }
  if (!state.showMultiPhase) { state.multiPhaseVoltage = null; state.multiPhaseItems = []; }
  if (typeof window.renderAll === 'function') window.renderAll();
}

export function setMPV(v) {
  state.multiPhaseVoltage = v;
  if (typeof window.renderAll === 'function') window.renderAll();
}

export function addMPI() {
  state.multiPhaseItems.push({ id: genId(), name: '', power: 0, qty: 1, running: true, hoursPerDay: 4, surge: false });
  if (typeof window.renderAll === 'function') window.renderAll();
}

export function qAdd(name, power, hours, surge, running) {
  state.loadItems.push({ id: genId(), name: name, power: power, qty: 1, running: running, hoursPerDay: hours, surge: surge });
  state.currentPreset = 'custom';
  if (typeof window.renderAll === 'function') window.renderAll();
}

export function qAddMP(name, power, hours, surge, running) {
  state.multiPhaseItems.push({ id: genId(), name: name, power: power, qty: 1, running: running, hoursPerDay: hours, surge: surge });
  state.currentPreset = 'custom';
  if (typeof window.renderAll === 'function') window.renderAll();
}

export function nextS() {
  state.currentStep = Math.min(state.currentStep + 1, 4);
  if (typeof window.renderAll === 'function') window.renderAll();
  scrollToTop();
}

export function prevS() {
  state.currentStep = Math.max(state.currentStep - 1, 1);
  if (typeof window.renderAll === 'function') window.renderAll();
  scrollToTop();
}

export function goTS(s) {
  state.currentStep = s;
  if (typeof window.renderAll === 'function') window.renderAll();
  scrollToTop();
}

export function setBT(h) {
  state.backupTime = h;
  if (typeof window.renderAll === 'function') window.renderAll();
}

export function hdlBC(v) {
  if (v === 'custom') setBT(6);
  else setBT(Number(v));
}

export function setST(t) {
  state.systemType = t;
  if (typeof window.renderAll === 'function') window.renderAll();
}

export function goW() {
  state.viewMode = 'wizard';
  if (typeof window.renderAll === 'function') window.renderAll();
  scrollToTop();
}

export function goL() {
  state.viewMode = 'landing';
  if (typeof window.renderAll === 'function') window.renderAll();
  scrollToTop();
}

export function goC() {
  state.viewMode = 'catalog';
  if (typeof window.renderAll === 'function') window.renderAll();
  scrollToTop();
}

export function resetAll() {
  Object.assign(state, {
    viewMode: 'landing', currentStep: 1, loadItems: [], multiPhaseItems: [],
    multiPhaseVoltage: null, showMultiPhase: false, backupTime: 8,
    systemType: 'off-grid', voltageStandard: 'eu', currentPreset: 'custom',
    timezone: (function() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch(e) { return 'Asia/Shanghai'; } })(),
    catalogTab: 'inverters',
    catalogFilters: {
      inverters: { standard: '', type: '', ip: '', search: '', sort: '' },
      lithium: { voltage: '', category: '', search: '', sort: '' },
      controllers: { type: '', search: '', sort: '' },
      ess: { standard: '', search: '', sort: '' },
      cells: { search: '', sort: '' }
    }
  });
  if (typeof window.renderAll === 'function') window.renderAll();
}

export function resetToStep1() {
  state.loadItems = [];
  state.multiPhaseItems = [];
  state.multiPhaseVoltage = null;
  state.showMultiPhase = false;
  state.backupTime = 8;
  state.systemType = 'off-grid';
  state.currentPreset = 'custom';
  state.currentStep = 1;
  if (typeof window.renderAll === 'function') window.renderAll();
  scrollToTop();
}

export function dlR() {
  const r = getRes(), inv = r.inverter, bat = r.battery;
  const essRecs = getRecESS(inv, state.voltageStandard);
  const sr = gTRP(state.loadItems), mr = gTRP(state.multiPhaseItems), ct = gTRP(getAllItems());
  const mpl = state.multiPhaseVoltage ? (MULTI_PHASE_VOLTAGES[state.voltageStandard].find(function(v) { return v.value === state.multiPhaseVoltage; }) || {}).label || state.multiPhaseVoltage : '';
  const c = 'PowMr System Sizer - Results\n================================\n\nYour Power Needs:\n- Single-phase total: ' + sr.toLocaleString() + 'W' + (state.multiPhaseItems.length > 0 ? '\n- Multi-phase (' + mpl + '): ' + mr.toLocaleString() + 'W' : '') + '\n- System total power: ' + ct.toLocaleString() + 'W\n\nInverter Recommendation:\n- Total running power: ' + Math.round(inv.totalRunningPower) + 'W\n- Peak power: ' + Math.round(inv.peakPower) + 'W\n- System voltage: ' + inv.systemVoltage + 'V\n- Inverter system: ' + (inv.inverterSize >= 1000 ? (inv.inverterSize / 1000) + 'kW' : inv.inverterSize + 'W') + (inv.isParallel ? ' (Parallel system)' : '') + '\n' + (inv.recommendedModels.length > 0 ? '- Recommended: ' + inv.recommendedModels.map(function(m) { const pt = m.totalRatedPower >= 1000 ? (m.totalRatedPower / 1000).toFixed(1) + 'kW' : m.totalRatedPower + 'W'; return m.model + (m.units > 1 ? ' x ' + m.units + 'u = ' + pt : ''); }).join(', ') : '') + '\n\nBattery Recommendation:\n- Daily energy: ' + Math.round(bat.dailyEnergyWh) + 'Wh/day\n- Backup time: ' + state.backupTime + 'h\n- Required: ' + bat.batteryKwh.toFixed(1) + 'kWh (' + Math.round(bat.requiredAh) + 'Ah)\n' + (bat.recommendedSolutions.length > 0 ? '- Recommended: ' + bat.recommendedSolutions.map(function(s) { return s.model + ' (' + Math.ceil(bat.requiredAh / s.ah) + ' units)'; }).join(', ') : (bat.requiredAh > 0 ? '- Custom: ' + Math.round(bat.requiredAh) + 'Ah battery bank required' : '')) + '\n\nESS Recommendation:\n' + (essRecs.length > 0 ? '- ' + essRecs.map(function(e) { return e.m + ' (' + (e.rp >= 1000 ? (e.rp / 1000).toFixed(1) + 'kW' : e.rp + 'W') + (e.bc ? ', ' + e.bc : '') + ')'; }).join(', ') : 'No suitable ESS available') + '\n\n================================\nGenerated: ' + new Date().toLocaleString('en-US', { timeZone: state.timezone, dateStyle: 'full', timeStyle: 'long' }) + ' (' + state.timezone + ')\n';
  const blob = new Blob([c], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'PowMr_System_Sizer_Result_' + Date.now() + '.txt';
  a.click();
  URL.revokeObjectURL(url);
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
