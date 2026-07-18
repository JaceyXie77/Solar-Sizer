// ============================================================
// STATE
// ============================================================
export let state = {
  viewMode: 'landing',
  currentStep: 1,
  loadItems: [],
  multiPhaseItems: [],
  multiPhaseVoltage: null,
  showMultiPhase: false,
  backupTime: 8,
  systemType: 'off-grid',
  voltageStandard: 'eu',
  currentPreset: 'custom',
  timezone: (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch(e) { return 'Asia/Shanghai'; } })(),
  catalogTab: 'inverters',
  catalogFilters: {
    inverters: { standard: '', type: '', ip: '', search: '', sort: '' },
    lithium: { voltage: '', category: '', search: '', sort: '' },
    controllers: { type: '', search: '', sort: '' },
    ess: { standard: '', search: '', sort: '' },
    cells: { search: '', sort: '' }
  },
  collection: [],
  selectedItems: new Set(),
  compareItems: [],
  drawerOpen: false,
};

export function saveCollection() {
  try { localStorage.setItem('powmr_collection', JSON.stringify(state.collection)); } catch(e) { console.warn('Storage save failed:', e); }
}

export function loadCollection() {
  try {
    const s = localStorage.getItem('powmr_collection');
    if (s) {
      state.collection = JSON.parse(s);
      // Deduplicate
      const seen = new Set();
      state.collection = state.collection.filter(item => {
        const k = item.cat + '|' + item.model;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    }
  } catch(e) { console.warn('Storage load failed:', e); }
}
