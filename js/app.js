// ============================================================
// DeepFind — PowMr Product Selection Tool
// Application Entry Point
// Imports all modules and mounts public API to window for
// inline onclick handlers in the HTML.
// ============================================================

// ── State ──
import { state, saveCollection as _saveCollection, loadCollection as _loadCollection } from './state.js';

// ── Data ──
import { INVERTER_MODELS, MAX_SINGLE_EU, MAX_SINGLE_US, MAX_PARALLEL_UNITS, CAT_INV_EU, CAT_INV_US } from './data/inverters.js';
import { BATTERY_SOLUTIONS, CAT_BAT, CAT_CELLS } from './data/batteries.js';
import { CAT_CTRL } from './data/controllers.js';
import { CAT_ESS } from './data/ess.js';
import { LOAD_PRESETS, PRESET_OPTIONS, STEP_TITLES, QUICK_APPLIANCES, QUICK_MP_APPLIANCES, VOLTAGE_LABELS, BACKUP_OPTIONS, SYSTEM_TYPES, MULTI_PHASE_VOLTAGES, PHASE_COUNT, COMMON_TIMEZONES } from './data/presets.js';

// ── Logic ──
import * as calc from './logic/calculator.js';
import * as recommendation from './logic/recommendation.js';
import * as loadAnalysis from './logic/load-analysis.js';
import * as volt from './logic/voltage.js';
import * as filters from './logic/filters.js';
import * as manuals from './logic/manuals.js';

// ── Utils ──
import { toast } from './utils/toast.js';
import * as helpers from './utils/helpers.js';

// ── UI ──
import * as landing from './ui/landing.js';
import * as wizard from './ui/wizard.js';
import * as catalog from './ui/catalog.js';
import * as collection from './ui/collection.js';
import { updateColBadge, renderAll } from './ui/collection.js';
import * as contact from './ui/contact.js';
import * as ideaLab from './ui/idea-lab.js';
import { initIdeaBubble } from './ui/idea-lab.js';

// ═══════════════════════════════════════════
// Mount everything to window for inline onclick
// ═══════════════════════════════════════════

// State
window.state = state;
window.saveCollection = _saveCollection;
window.loadCollection = _loadCollection;

// Data (read-only access for debugging)
window.INVERTER_MODELS = INVERTER_MODELS;
window.BATTERY_SOLUTIONS = BATTERY_SOLUTIONS;
window.LOAD_PRESETS = LOAD_PRESETS;
window.PRESET_OPTIONS = PRESET_OPTIONS;
window.STEP_TITLES = STEP_TITLES;
window.QUICK_APPLIANCES = QUICK_APPLIANCES;
window.QUICK_MP_APPLIANCES = QUICK_MP_APPLIANCES;
window.VOLTAGE_LABELS = VOLTAGE_LABELS;
window.BACKUP_OPTIONS = BACKUP_OPTIONS;
window.MULTI_PHASE_VOLTAGES = MULTI_PHASE_VOLTAGES;
window.PHASE_COUNT = PHASE_COUNT;
window.COMMON_TIMEZONES = COMMON_TIMEZONES;

// Logic — mount all exports
Object.assign(window, calc);
Object.assign(window, recommendation);
Object.assign(window, loadAnalysis);
Object.assign(window, volt);
Object.assign(window, filters);
Object.assign(window, manuals);

// Utils
window.toast = toast;
Object.assign(window, helpers);

// UI — mount all exports
Object.assign(window, landing);
Object.assign(window, wizard);
Object.assign(window, catalog);
Object.assign(window, collection);
Object.assign(window, contact);
Object.assign(window, ideaLab);

// ═══════════════════════════════════════════
// Initialization
// ═══════════════════════════════════════════
_loadCollection();
updateColBadge();
renderAll();
initIdeaBubble();
