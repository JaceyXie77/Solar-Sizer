// ============================================================
// CALCULATOR — Core sizing & recommendation logic
// ============================================================
import { state } from '../state.js';
import { INVERTER_MODELS, MAX_SINGLE_EU, MAX_SINGLE_US, MAX_PARALLEL_UNITS } from '../data/inverters.js';
import { BATTERY_SOLUTIONS } from '../data/batteries.js';
import { CAT_ESS } from '../data/ess.js';
import { getModelVoltage, getVoltageSelectSimple } from './voltage.js';

export function genId() {
  return Math.random().toString(36).substr(2, 9);
}

export function getEP(m) {
  return m.maxPeak !== undefined ? m.maxPeak : m.ratedPower;
}

export function getRecInv(pp, vs) {
  const ms = (INVERTER_MODELS[vs] || []).filter(function(m) { return m.sv !== 0 && m.type !== 'Power inverter'; });
  const th = vs === 'eu' ? MAX_SINGLE_EU : MAX_SINGLE_US;
  if (pp <= th) {
    const c = ms.filter(function(m) { return getEP(m) >= pp; }).sort(function(a, b) { return a.ratedPower - b.ratedPower; });
    if (c.length > 0) {
      return c.slice(0, 8).map(function(b) { return { model: b.model, ratedPower: b.ratedPower, parallelCapable: b.parallelCapable, sv: b.sv, units: 1, totalRatedPower: b.ratedPower, excess: b.ratedPower - pp }; });
    }
    return [];
  }
  return ms.filter(function(m) { return m.parallelCapable; })
    .map(function(m) {
      const u = Math.ceil(pp / m.ratedPower), tr = u * m.ratedPower, e = tr - pp;
      return { model: m.model, ratedPower: m.ratedPower, parallelCapable: true, sv: m.sv, units: u, totalRatedPower: tr, excess: e, score: e / pp + u * 0.02 };
    })
    .filter(function(r) { return r.units >= 2 && r.units <= MAX_PARALLEL_UNITS; })
    .sort(function(a, b) { return a.score - b.score; })
    .slice(0, 5);
}

export function getRecBatt(sv, ra) {
  if (!ra || ra <= 0) return [];
  const s = BATTERY_SOLUTIONS[sv] || [];
  if (!s.length) return [];
  return s.filter(function(s) { return Math.ceil(ra / s.ah) <= s.maxParallel; }).slice(0, 5);
}

export function getRecESS(inv, vs) {
  const essProducts = CAT_ESS.filter(function(e) { return e.st === vs; });
  if (!essProducts.length) return [];
  var matches = essProducts.filter(function(e) { return e.rp >= inv.peakPower; });
  matches.sort(function(a, b) { return a.rp - b.rp; });
  return matches;
}

export function calcInv(items, vs) {
  const ri = items.filter(function(i) { return i.running; });
  const nri = items.filter(function(i) { return !i.running; });
  const rs = ri.reduce(function(s, i) { return s + i.power * i.qty; }, 0);
  let mx = 0, mxi = null;
  for (const i of nri) { const t = i.power * i.qty; if (t > mx) { mx = t; mxi = i; } }
  const trp = rs + mx, ci = [...ri];
  if (mxi) ci.push(mxi);
  const hs = ci.some(function(i) { return i.surge; });
  let pp;
  if (hs) {
    const ss = ci.filter(function(i) { return i.surge; }).reduce(function(s, i) { return s + i.power * i.qty; }, 0);
    const nss = ci.filter(function(i) { return !i.surge; }).reduce(function(s, i) { return s + i.power * i.qty; }, 0);
    pp = ss * 2 + nss * 1.2;
  } else {
    pp = trp * 1.2;
  }
  // EU three-phase: no single three-phase inverters available, force parallel-capable models
  var isThreePhaseEU = vs === 'eu' && state.multiPhaseVoltage === 'three_phase_400' && state.multiPhaseItems.length > 0;
  var effPp = isThreePhaseEU ? Math.max(pp, MAX_SINGLE_EU + 1) : pp;
  const rmAll = getRecInv(effPp, vs);
  const logicalVoltage = getVoltageSelectSimple(pp);
  var sv = logicalVoltage;
  var rm = rmAll.filter(function(m) { return m.sv === sv; });
  var voltageOverridden = false;
  if (!rm.length) { rm = rmAll; if (rm.length) { sv = rm[0].sv || sv; voltageOverridden = sv !== logicalVoltage; } }
  const b = rm[0], is = b ? b.units > 1 : false;
  return {
    totalRunningPower: trp, peakPower: pp,
    effectivePeakPower: effPp, systemVoltage: sv,
    logicalVoltage: logicalVoltage, voltageOverridden: voltageOverridden,
    inverterSize: b ? b.totalRatedPower : effPp,
    inverterModel: b ? b.model : 'Unknown',
    recommendedModels: rm, isParallel: is, threePhaseEU: isThreePhaseEU
  };
}

export function calcBat(dew, bt, sv) {
  const be = dew * (bt / 24), ub = be / 0.8 / 0.9, bk = ub / 1000;
  const sva = sv === 12 ? 12.8 : (sv === 24 ? 25.6 : 51.2);
  const ra = ub / sva, rs = getRecBatt(sv, ra);
  return { dailyEnergyWh: dew, backupEnergyWh: be, usableBatteryWh: ub, batteryKwh: bk, requiredAh: ra, recommendedSolutions: rs };
}

export function getAllItems() {
  return [...state.loadItems, ...state.multiPhaseItems];
}

export function gTRP(items) {
  const ri = items.filter(function(i) { return i.running; });
  const nri = items.filter(function(i) { return !i.running; });
  let mx = 0;
  for (const i of nri) { if (i.power * i.qty > mx) mx = i.power * i.qty; }
  return ri.reduce(function(s, i) { return s + i.power * i.qty; }, 0) + mx;
}

export function getRes() {
  const ai = getAllItems();
  const dew = ai.reduce(function(s, i) { return s + i.power * i.qty * i.hoursPerDay; }, 0);
  const inv = calcInv(ai, state.voltageStandard);
  const bat = calcBat(dew, state.backupTime, inv.systemVoltage);
  const ess = getRecESS(inv, state.voltageStandard);
  return { inverter: inv, battery: bat, ess: ess };
}
