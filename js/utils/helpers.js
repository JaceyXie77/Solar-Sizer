import { CAT_INV_EU, CAT_INV_US } from '../data/inverters.js';
import { CAT_BAT, CAT_CELLS } from '../data/batteries.js';
import { CAT_CTRL } from '../data/controllers.js';
import { CAT_ESS } from '../data/ess.js';
import { MANUAL_TREE, folderUrl, getManualUrl } from '../logic/manuals.js';

export function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function lowCTA() {
  return '<div class="no-match-cta"><div class="nmc-inner"><div class="nmc-icon">\uD83D\uDD0D</div><div class="nmc-text"><p class="nmc-title">Limited results? Let us help.</p><p class="nmc-desc">Our team can source custom specifications, bulk orders, or products not listed in our catalog.</p></div><button class="btn btn-primary btn-lg" onclick="openContact(\'\')">Contact Us for Custom Solutions \u2192</button></div></div>';
}

export function findProduct(cat, model) {
  if (cat === 'inverters') {
    for (const a of [CAT_INV_EU, CAT_INV_US]) { const f = a.find(p => p.m === model); if (f) return f; }
  } else if (cat === 'controllers') {
    const f = CAT_CTRL.find(p => p.m === model); if (f) return f;
  } else if (cat === 'ess') {
    const f = CAT_ESS.find(p => p.m === model); if (f) return f;
  } else if (cat === 'cells') {
    const f = CAT_CELLS.find(p => p.m === model); if (f) return f;
  } else {
    const f = CAT_BAT.find(p => p.m === model); if (f) return f;
  }
  return null;
}

export function findProductAny(model) {
  for (const a of [CAT_INV_EU, CAT_INV_US, CAT_CTRL, CAT_BAT, CAT_ESS, CAT_CELLS]) {
    var f = a.find(function(x) { return x.m === model; });
    if (f) return f;
  }
  return null;
}

export function findProductCat(model) {
  if (CAT_INV_EU.find(function(x) { return x.m === model; }) || CAT_INV_US.find(function(x) { return x.m === model; })) return 'inverters';
  if (CAT_CTRL.find(function(x) { return x.m === model; })) return 'controllers';
  if (CAT_BAT.find(function(x) { return x.m === model; })) return 'lithium';
  if (CAT_ESS.find(function(x) { return x.m === model; })) return 'ess';
  if (CAT_CELLS.find(function(x) { return x.m === model; })) return 'cells';
  return null;
}

export function getUrlByModel(model) {
  for (const arr of [CAT_INV_EU, CAT_INV_US, CAT_CTRL, CAT_BAT, CAT_ESS, CAT_CELLS]) {
    const found = arr.find(p => p.m === model);
    if (found && found.url) return found.url;
  }
  return '';
}

export function getCollectionSummary(cat, p) {
  if (!p) return '';
  if (cat === 'inverters') return p.pkw + ' / ' + p.sv + ' (' + (p.st || '').toUpperCase() + ')';
  if (cat === 'controllers') return p.c + 'A / ' + p.sv + ' / ' + p.ty;
  if (cat === 'batteries' || cat === 'lithium') return p.ah + 'Ah / ' + p.sv + ' / ' + p.ff;
  if (cat === 'ess') return p.pkw + ' / ' + p.bc + ' (' + (p.st || '').toUpperCase() + ')';
  if (cat === 'cells') return p.ah + 'Ah / ' + p.wh + ' (' + p.sv + ')';
  return '';
}

export function extractNum(str) {
  str = String(str);
  let main = str.indexOf('(') >= 0 ? str.substring(0, str.indexOf('(')).trim() : str;
  if (main.indexOf('/') >= 0) main = main.substring(0, main.indexOf('/')).trim();
  return parseFloat(main.replace(/[^0-9.]/g, '')) || 0;
}

export function openManual(model) {
  var p = findProductAny(model);
  var cat = p ? findProductCat(model) : null;
  var url = p && cat ? getManualUrl(cat, p) : folderUrl(MANUAL_TREE._id);
  window.open(url, '_blank');
}
