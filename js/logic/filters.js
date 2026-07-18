// ============================================================
// FILTERS — Catalog product filtering & counting logic
// ============================================================
import { state } from '../state.js';
import { CAT_INV_EU, CAT_INV_US } from '../data/inverters.js';
import { CAT_BAT, CAT_CELLS } from '../data/batteries.js';
import { CAT_CTRL } from '../data/controllers.js';
import { CAT_ESS } from '../data/ess.js';

export function applySingleFilter(tab, k, v, prods) {
  if (!v) return prods;
  if (tab === 'inverters') {
    if (k === 'standard') return prods.filter(p => p.st === v);
    if (k === 'type') {
      const tl = v.toLowerCase();
      if (tl === 'all-in-one') return prods.filter(p => p.t.toLowerCase().includes('all-in-one'));
      if (tl === 'split-phase') return prods.filter(p => p.t.toLowerCase().includes('split'));
      if (tl === 'low-freq') return prods.filter(p => p.t.toLowerCase().includes('low-freq'));
      if (tl === 'power-inv') return prods.filter(p => p.t.toLowerCase().includes('power inverter'));
      if (tl === 'batteryless') return prods.filter(p => p.t.toLowerCase().includes('batteryless'));
      return prods;
    }
    if (k === 'ip') {
      if (v === 'ip20') return prods.filter(p => (p.ip || '').includes('IP20'));
      if (v === 'ip65') return prods.filter(p => (p.ip || '').includes('IP65'));
      return prods;
    }
    return prods;
  }
  if (tab === 'lithium') {
    if (k === 'voltage') {
      if (v === '12V') return prods.filter(b => b.sv.startsWith('12'));
      if (v === '25V') return prods.filter(b => b.sv.startsWith('25'));
      if (v === '48V') return prods.filter(b => b.sv.startsWith('51'));
      return prods;
    }
    if (k === 'category') {
      if (v === 'lead-acid') return prods.filter(b => b.ct !== 'cell' && b.ff.toLowerCase().includes('lead'));
      if (v === 'residential') return prods.filter(b => b.ct !== 'cell' && (b.ff.toLowerCase().includes('wall') || b.ff.toLowerCase().includes('stack') || b.ff.toLowerCase().includes('floor')));
      if (v === 'cells') return prods.filter(b => b.ct === 'cell');
      return prods;
    }
    if (k === 'cellType') {
      if (v === 'cell') return prods.filter(b => b.ct === 'cell');
      if (v === 'battery') return prods.filter(b => b.ct !== 'cell');
      return prods;
    }
    return prods;
  }
  if (tab === 'controllers') {
    if (k === 'type') {
      const tl = v.toLowerCase();
      if (tl === 'mppt') return prods.filter(c => c.ty.toLowerCase().includes('mppt'));
      if (tl === 'pwm') return prods.filter(c => c.ty.toLowerCase().includes('pwm'));
      return prods;
    }
    return prods;
  }
  if (tab === 'ess') {
    if (k === 'standard') return prods.filter(p => p.st === v);
    return prods;
  }
  return prods;
}

export function getAvailCounts(tab, excludeKey) {
  const f = state.catalogFilters[tab];
  let base = [];
  if (tab === 'inverters') base = [...CAT_INV_EU, ...CAT_INV_US];
  else if (tab === 'lithium') base = [...CAT_BAT, ...CAT_CELLS];
  else if (tab === 'controllers') base = [...CAT_CTRL];
  else if (tab === 'ess') base = [...CAT_ESS];
  let filtered = [...base];
  for (const [k, v] of Object.entries(f)) {
    if (k === excludeKey || k === 'search' || k === 'sort' || !v) continue;
    filtered = applySingleFilter(tab, k, v, filtered);
  }
  const counts = {};
  const valMap = {};
  if (tab === 'inverters') {
    if (excludeKey === 'standard') {
      valMap.eu = 'EU (230V)'; valMap.us = 'US (110/120V)';
      filtered.forEach(p => { const vk = p.st; counts[vk] = (counts[vk] || 0) + 1; });
    } else if (excludeKey === 'type') {
      valMap['all-in-one'] = 'All-in-one'; valMap['split-phase'] = 'Split-phase';
      valMap['low-freq'] = 'Low-frequency'; valMap['power-inv'] = 'Power inverter';
      valMap['batteryless'] = 'Batteryless';
      filtered.forEach(p => {
        const tl = p.t.toLowerCase();
        if (tl.includes('batteryless')) counts['batteryless'] = (counts['batteryless'] || 0) + 1;
        else if (tl.includes('low-freq')) counts['low-freq'] = (counts['low-freq'] || 0) + 1;
        else if (tl.includes('split')) counts['split-phase'] = (counts['split-phase'] || 0) + 1;
        else if (tl.includes('power inverter')) counts['power-inv'] = (counts['power-inv'] || 0) + 1;
        else if (tl.includes('all-in-one')) counts['all-in-one'] = (counts['all-in-one'] || 0) + 1;
      });
    } else if (excludeKey === 'ip') {
      valMap.ip20 = 'IP20'; valMap.ip65 = 'IP65';
      filtered.forEach(p => {
        const ip = p.ip || '';
        if (ip.includes('IP65')) counts.ip65 = (counts.ip65 || 0) + 1;
        else if (ip.includes('IP20')) counts.ip20 = (counts.ip20 || 0) + 1;
      });
    }
  } else if (tab === 'lithium') {
    if (excludeKey === 'voltage') {
      valMap['12V'] = '12.8V'; valMap['25V'] = '25.6V'; valMap['48V'] = '51.2V';
      filtered.forEach(b => {
        if (b.sv.startsWith('12')) counts['12V'] = (counts['12V'] || 0) + 1;
        else if (b.sv.startsWith('25')) counts['25V'] = (counts['25V'] || 0) + 1;
        else if (b.sv.startsWith('51')) counts['48V'] = (counts['48V'] || 0) + 1;
      });
    } else if (excludeKey === 'category') {
      valMap['lead-acid'] = 'Lead-Acid Replacement';
      valMap['residential'] = 'Residential Energy Storage';
      valMap['cells'] = 'LiFePO4 Prismatic Cells';
      filtered.forEach(b => {
        if (b.ct === 'cell') counts['cells'] = (counts['cells'] || 0) + 1;
        else {
          const fl = b.ff.toLowerCase();
          if (fl.includes('lead')) counts['lead-acid'] = (counts['lead-acid'] || 0) + 1;
          else if (fl.includes('wall') || fl.includes('stack') || fl.includes('floor'))
            counts['residential'] = (counts['residential'] || 0) + 1;
        }
      });
    } else if (excludeKey === 'cellType') {
      valMap['battery'] = 'Lithium Batteries'; valMap['cell'] = 'LiFePO4 Prismatic Cells';
      filtered.forEach(b => {
        if (b.ct === 'cell') counts['cell'] = (counts['cell'] || 0) + 1;
        else counts['battery'] = (counts['battery'] || 0) + 1;
      });
    }
  } else if (tab === 'controllers') {
    if (excludeKey === 'type') {
      valMap.mppt = 'MPPT'; valMap.pwm = 'PWM';
      filtered.forEach(c => {
        const tl = c.ty.toLowerCase();
        if (tl.includes('mppt')) counts.mppt = (counts.mppt || 0) + 1;
        if (tl.includes('pwm')) counts.pwm = (counts.pwm || 0) + 1;
      });
    }
  } else if (tab === 'ess') {
    if (excludeKey === 'standard') {
      valMap.eu = 'EU (230V)'; valMap.us = 'US (110/120V)';
      filtered.forEach(p => { const vk = p.st; counts[vk] = (counts[vk] || 0) + 1; });
    }
  }
  const total = filtered.length;
  return { counts, valMap, total };
}

export function optEl(val, label, counts, currentVal, realTotal) {
  const c = counts[val] || 0;
  const dis = c === 0 && val !== '';
  const sel = currentVal === val ? ' selected' : '';
  const total = realTotal !== undefined ? realTotal : Object.values(counts).reduce((s, v) => s + v, 0);
  const suffix = val === '' ? ' (' + total + ')' : c > 0 ? ' <span class="opt-count">(' + c + ')</span>' : ' <span class="opt-count opt-unavail">(0)</span>';
  return '<option value="' + val + '"' + sel + (dis ? ' disabled' : '') + '>' + label + suffix + '</option>';
}

export function getFiltered() {
  const t = state.catalogTab, f = state.catalogFilters[t];
  let res = [];
  if (t === 'inverters') {
    res = [...CAT_INV_EU, ...CAT_INV_US];
    if (f.standard) res = applySingleFilter('inverters', 'standard', f.standard, res);
    if (f.type) res = applySingleFilter('inverters', 'type', f.type, res);
  }
  if (t === 'lithium') {
    res = [...CAT_BAT, ...CAT_CELLS];
    if (f.voltage) res = applySingleFilter('lithium', 'voltage', f.voltage, res);
    if (f.category) res = applySingleFilter('lithium', 'category', f.category, res);
    if (f.cellType) res = applySingleFilter('lithium', 'cellType', f.cellType, res);
  }
  if (t === 'controllers') {
    res = [...CAT_CTRL];
    if (f.type) res = applySingleFilter('controllers', 'type', f.type, res);
  }
  if (t === 'ess') {
    res = [...CAT_ESS];
    if (f.standard) res = applySingleFilter('ess', 'standard', f.standard, res);
  }
  // Search
  if (f.search) { const q = f.search.toLowerCase(); res = res.filter(p => p.m.toLowerCase().includes(q)); }
  // Sort
  if (f.sort) {
    if (f.sort === 'power-asc') res.sort((a, b) => a.rp - b.rp);
    else if (f.sort === 'power-desc') res.sort((a, b) => b.rp - a.rp);
    else if (f.sort === 'ah-asc') res.sort((a, b) => (a.ah || 0) - (b.ah || 0));
    else if (f.sort === 'ah-desc') res.sort((a, b) => (b.ah || 0) - (a.ah || 0));
    else if (f.sort === 'current-asc') res.sort((a, b) => a.c - b.c);
    else if (f.sort === 'current-desc') res.sort((a, b) => b.c - a.c);
    else if (f.sort === 'kwh-asc') res.sort((a, b) => { const pa = parseFloat(a.bc) || 0, pb = parseFloat(b.bc) || 0; return pa - pb; });
    else if (f.sort === 'kwh-desc') res.sort((a, b) => { const pa = parseFloat(a.bc) || 0, pb = parseFloat(b.bc) || 0; return pb - pa; });
  }
  return res;
}
