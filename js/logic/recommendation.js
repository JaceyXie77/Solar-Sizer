// ============================================================
// RECOMMENDATION — Product matching rules
// ============================================================

import { state } from '../state.js';
import { INVERTER_MODELS, MAX_SINGLE_EU, MAX_SINGLE_US, MAX_PARALLEL_UNITS } from '../data/inverters.js';
import { BATTERY_SOLUTIONS } from '../data/batteries.js';
import { CAT_ESS } from '../data/ess.js';
import { getVoltageSelectSimple } from './voltage.js';
import { calculatePeakPower, calculateTotalRunningPower } from './load-analysis.js';

export function getEquipmentPeak(model) {
  return model.maxPeak !== undefined ? model.maxPeak : model.ratedPower;
}

export function getRecInv(requiredPeakPower, voltageStandard) {
  const models = (INVERTER_MODELS[voltageStandard] || []).filter(function(model) {
    return model.sv !== 0 && model.type !== 'Power inverter';
  });

  const singleUnitThreshold = voltageStandard === 'eu' ? MAX_SINGLE_EU : MAX_SINGLE_US;
  if (requiredPeakPower <= singleUnitThreshold) {
    const candidates = models
      .filter(function(model) { return getEquipmentPeak(model) >= requiredPeakPower; })
      .sort(function(a, b) { return a.ratedPower - b.ratedPower; });

    return candidates.slice(0, 8).map(function(model) {
      return {
        model: model.model,
        ratedPower: model.ratedPower,
        parallelCapable: model.parallelCapable,
        sv: model.sv,
        units: 1,
        totalRatedPower: model.ratedPower,
        excess: model.ratedPower - requiredPeakPower,
      };
    });
  }

  return models
    .filter(function(model) { return model.parallelCapable; })
    .map(function(model) {
      const units = Math.ceil(requiredPeakPower / model.ratedPower);
      const totalRatedPower = units * model.ratedPower;
      const excess = totalRatedPower - requiredPeakPower;
      return {
        model: model.model,
        ratedPower: model.ratedPower,
        parallelCapable: true,
        sv: model.sv,
        units: units,
        totalRatedPower: totalRatedPower,
        excess: excess,
        score: excess / requiredPeakPower + units * 0.02,
      };
    })
    .filter(function(result) { return result.units >= 2 && result.units <= MAX_PARALLEL_UNITS; })
    .sort(function(a, b) { return a.score - b.score; })
    .slice(0, 5);
}

export function getRecBatt(systemVoltage, requiredAh) {
  if (!requiredAh || requiredAh <= 0) return [];
  const solutions = BATTERY_SOLUTIONS[systemVoltage] || [];
  return solutions
    .filter(function(solution) { return Math.ceil(requiredAh / solution.ah) <= solution.maxParallel; })
    .slice(0, 5);
}

export function getRecESS(inverterResult, voltageStandard) {
  return CAT_ESS
    .filter(function(product) { return product.st === voltageStandard && product.rp >= inverterResult.peakPower; })
    .sort(function(a, b) { return a.rp - b.rp; });
}

export function calculateInverterRecommendation(items, voltageStandard) {
  const peakPower = calculatePeakPower(items);
  const totalRunningPower = calculateTotalRunningPower(items);

  const isThreePhaseEU = (
    voltageStandard === 'eu' &&
    state.multiPhaseVoltage === 'three_phase_400' &&
    state.multiPhaseItems.length > 0
  );
  const effectivePeakPower = isThreePhaseEU ? Math.max(peakPower, MAX_SINGLE_EU + 1) : peakPower;

  const allRecommendations = getRecInv(effectivePeakPower, voltageStandard);
  const logicalVoltage = getVoltageSelectSimple(peakPower);

  let systemVoltage = logicalVoltage;
  let recommendedModels = allRecommendations.filter(function(model) { return model.sv === systemVoltage; });
  let voltageOverridden = false;

  if (!recommendedModels.length) {
    recommendedModels = allRecommendations;
    if (recommendedModels.length) {
      systemVoltage = recommendedModels[0].sv || systemVoltage;
      voltageOverridden = systemVoltage !== logicalVoltage;
    }
  }

  const bestModel = recommendedModels[0];
  return {
    totalRunningPower: totalRunningPower,
    peakPower: peakPower,
    effectivePeakPower: effectivePeakPower,
    systemVoltage: systemVoltage,
    logicalVoltage: logicalVoltage,
    voltageOverridden: voltageOverridden,
    inverterSize: bestModel ? bestModel.totalRatedPower : effectivePeakPower,
    inverterModel: bestModel ? bestModel.model : 'Unknown',
    recommendedModels: recommendedModels,
    isParallel: bestModel ? bestModel.units > 1 : false,
    threePhaseEU: isThreePhaseEU,
  };
}
