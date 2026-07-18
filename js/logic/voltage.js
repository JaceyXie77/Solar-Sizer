// ============================================================
// VOLTAGE — Product-library-driven system voltage analysis
// ============================================================
import { INVERTER_MODELS, MAX_PARALLEL_UNITS } from '../data/inverters.js';

/**
 * Analyze all available inverters for a voltage standard,
 * return a map of systemVoltage -> { maxSingle, maxParallel, minSingle, hasParallel }
 */
export function analyzeProductVoltages(vs) {
  var models = INVERTER_MODELS[vs] || [];
  var vm = {};
  models.forEach(function(m) {
    if (!m.sv || m.sv === 0) return;
    if (!vm[m.sv]) vm[m.sv] = { maxSingle: 0, maxParallel: 0, minSingle: Infinity, hasParallel: false };
    if (m.ratedPower > vm[m.sv].maxSingle) vm[m.sv].maxSingle = m.ratedPower;
    if (m.ratedPower < vm[m.sv].minSingle) vm[m.sv].minSingle = m.ratedPower;
    if (m.parallelCapable) {
      vm[m.sv].hasParallel = true;
      var mp = m.ratedPower * MAX_PARALLEL_UNITS;
      if (mp > vm[m.sv].maxParallel) vm[m.sv].maxParallel = mp;
    }
  });
  return vm;
}

/** From a list of product-capable voltages, pick the smallest one that can handle peakPower pp */
export function getSVFromProducts(pp, vs) {
  var vm = analyzeProductVoltages(vs);
  var voltages = Object.keys(vm).map(Number).sort(function(a, b) { return a - b; });
  if (!voltages.length) return getSVNum(pp);
  for (var i = 0; i < voltages.length; i++) {
    var v = voltages[i];
    if (vm[v].maxSingle >= pp || vm[v].maxParallel >= pp) return v;
  }
  return voltages[voltages.length - 1];
}

/** Get the available voltage range string for a given peak power */
export function getSVRangeFromProducts(pp, vs) {
  var vm = analyzeProductVoltages(vs);
  var voltages = Object.keys(vm).map(Number).sort(function(a, b) { return a - b; });
  if (!voltages.length) return getSVRange(pp);
  var ap = voltages.filter(function(v) { return vm[v].maxSingle >= pp || vm[v].maxParallel >= pp; });
  if (ap.length === 0) ap = [voltages[voltages.length - 1]];
  if (ap.length === 1) return ap[0] + 'V';
  return ap.map(function(v) { return v + 'V'; }).join('/');
}

/** Guide text explaining voltage selection rules */
export function getVoltageGuideText(vs) {
  return 'System voltage determined by Peak Power \u2014 \u003C3kW\u219212V/24V / 3\u20135kW\u219224V / \u22655kW\u219248V';
}

/** Simple guide-based helpers (used for C-end wizard display) */
export function getVoltageRangeSimple(pp) {
  if (pp < 3000) return '12V / 24V';
  if (pp < 5000) return '24V';
  return '48V';
}

export function getVoltageSelectSimple(pp) {
  if (pp < 5000) return 24;
  return 48;
}

/** Legacy fallback (used when product library has no voltage data) */
export function getSVNum(pp) {
  if (pp < 3000) return 12;
  if (pp < 4000) return 12;
  if (pp < 5000) return 24;
  return 48;
}

export function getSVRange(pp) {
  if (pp < 3000) return '12V';
  if (pp < 4000) return '12V/24V';
  if (pp < 5000) return '24V';
  return '48V';
}

export function getModelVoltage(m) {
  if (!m) return 0;
  if (m.includes('12V')) return 12;
  if (m.includes('24V')) return 24;
  if (m.includes('48V')) return 48;
  return 0;
}
