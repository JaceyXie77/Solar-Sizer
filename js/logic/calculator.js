// ============================================================
// CALCULATOR — Aggregates sizing and recommendation modules
// ============================================================
import { state } from '../state.js';
import { getRecInv, getRecBatt, getRecESS, calculateInverterRecommendation, getEquipmentPeak } from './recommendation.js';
import { calculateDailyEnergyWh, calculateTotalRunningPower } from './load-analysis.js';

export { getRecInv, getRecBatt, getRecESS } from './recommendation.js';

export function genId() {
  return Math.random().toString(36).substr(2, 9);
}

export function getEP(m) {
  return getEquipmentPeak(m);
}

export function calcInv(items, vs) {
  return calculateInverterRecommendation(items, vs);
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
  return calculateTotalRunningPower(items);
}

export function getRes() {
  const ai = getAllItems();
  const dew = calculateDailyEnergyWh(ai);
  const inv = calcInv(ai, state.voltageStandard);
  const bat = calcBat(dew, state.backupTime, inv.systemVoltage);
  const ess = getRecESS(inv, state.voltageStandard);
  return { inverter: inv, battery: bat, ess: ess };
}
