// ============================================================
// MANUALS — Google Drive folder tree & URL resolution
// ============================================================

export function folderUrl(id) {
  return 'https://drive.google.com/drive/folders/' + id + '?usp=drive_link';
}

// ---------- EU Inverters: map product type+IP -> Google Drive folder key ----------
function euInvFolderKey(p) {
  var t = p.t || '';
  var ip = p.ip || '';
  if (t === 'All-in-one') {
    if (ip.indexOf('IP65') >= 0) return 'ip65-all-in-one';
    return 'ip21-all-in-one';
  }
  if (t === 'Batteryless') return 'batteryless';
  if (t === 'Three-phase Hybrid') return 'hybrid';
  if (t === 'Power inverter') return 'power-inverter';
  return t.toLowerCase().replace(/[^a-z0-9]/g, '-');
}

// ---------- US Inverters: map product type -> Google Drive folder key ----------
function usInvFolderKey(p) {
  var t = p.t || '';
  if (t === 'Low-freq, All-in-one') return 'low-frequency';
  if (t === 'Split-phase, Low-frequency') return 'low-frequency';
  if (t === 'Split-phase, Hybrid') return 'ip65-hybrid';
  if (t === 'All-in-one' || t === 'All-in-one, Split' || t === 'All-in-one Split') return 'ip21-all-in-one';
  if (t === 'Power inverter') return 'power-inverter';
  return t.toLowerCase().replace(/[^a-z0-9]/g, '-');
}

// ---------- Controllers: map type -> Google Drive folder key ----------
function ctrlFolderKey(p) {
  var t = (p.ty || '').trim();
  if (t.indexOf('PWM') === 0) return 'pwm';
  return 'mppt';
}

// ---------- Batteries: map form-factor+IP -> Google Drive folder key ----------
export function batFolderKey(p) {
  var ip = p.ip || '';
  if (ip.indexOf('IP65') >= 0) return 'ip65';
  var ff = p.ff || '';
  if (ff === 'Lead-Acid Replacement') return 'lead-acid';
  if (ff === 'Wall-Mounted') return 'wall-mounted';
  if (ff === 'Stackable') return 'stackable';
  if (ff === 'Floor-Standing') return 'floor-standing';
  return ff.toLowerCase().replace(/[^a-z0-9]/g, '-');
}

export const MANUAL_TREE = {
  _id: '1jp287yyv_JJWF-LjH7ExCvCwg5Muu85Y', // Root: PowMr Solar Product User Manual

  inverters: {
    _id: '1m33513IyoMROKXYrQRxfw4TJ3SuHaXzP', // Inverter
    _lookup(p) {
      if (p.st === 'eu') return ['eu', euInvFolderKey(p)];
      return ['us', usInvFolderKey(p)];
    },
    eu: {
      _id: '1MhXGTB9OopwvQjqoTgTR_z9TiHDfmgwX', // EU (230V)
      'batteryless': { _id: '1VtGrZ0JiSbBdGnOrdRZ4OMJrA2hJOLHo' },
      'hybrid': { _id: '1P2t68pCxpgG_W4cECTnt11Xu9YAUWxyp' },
      'ip21-all-in-one': { _id: '1ax7DhICRHj83cpC9VEqRDicwsEBUAdpZ' },
      'ip65-all-in-one': { _id: '1m4Mdox5THz6n7IpuqlJj303rWIbYX7QG' },
      'power-inverter': { _id: '1NEmRYaYWTpVgVU4q3XVTOCXfhHrdNeZi' },
    },
    us: {
      _id: '1Qd3l7Ury_IUWKXGeUjpCFVRbtcfSryiW', // US (110V/120V)
      'ip21-all-in-one': { _id: '1zCtU5eybgamIvBGmH5AVa_8Lg70CVK3E' },
      'ip65-hybrid': { _id: '1E6YVMnc2LS_NSC_yDWlk7rXrcF26l93S' },
      'low-frequency': { _id: '1SwkXgYAr_c3Y_JqsXPwMMTFvBZIK2YTi' },
      'power-inverter': { _id: '1qejSi2xtD2lOSNUcBHuv-H-D_0hgOllG' },
    },
  },

  controllers: {
    _id: '1uimno4DU_nFJm3o5qGE1oOZ0MIZOvSEl', // Controller
    _lookup(p) { return [ctrlFolderKey(p)]; },
    pwm: { _id: '1xKLrn25_4rtNeEpb1rXck3wIJsdCF75y' },
    mppt: { _id: '1m-8pwpiS17g49CeGkXP6KwUWGU6DvbCT' },
  },

  lithium: {
    _id: '1EgZr0Afhewp6M2ZB6VTLw0siyoqSWtBv', // Lithium Battery
    _lookup(p) { return [batFolderKey(p)]; },
    'lead-acid': { _id: '1ti6TPxzmn72MvvQAsHyDBColuUnqTaPF' },
    'wall-mounted': { _id: '1e-m-76x7pGxY4jMDj-WG7e9bgc1bARNB' },
    'stackable': { _id: '1uixDxnuE8hUpdKSTKnPvuB5XfH70r7Wy' },
    'floor-standing': { _id: '1t2AZEI0avDM2lq5fpwesDVPm5W54jDpt' },
    'high-voltage': { _id: '1tvfT34QIEjTukEzUjAO79joYEkdHwK0F' },
    'ip65': { _id: '1GekpvF5UyqasryqKyCH9_M0izQQpXACI' },
  },

  ess: {
    _id: '1jp287yyv_JJWF-LjH7ExCvCwg5Muu85Y', // Root fallback
    _lookup(p) {
      if (p.st === 'us') return ['us'];
      return ['eu'];
    },
    us: { _id: '1uQxcenFhsbh_lLNbcCIuyvCITA4Uzlkg' },
    eu: { _id: '1JAyVwE55eR71qOzaREhp3iI5eoypt5YC' },
  },

  cells: {
    _id: '1jp287yyv_JJWF-LjH7ExCvCwg5Muu85Y', // Root fallback
    _lookup(p) { return [batFolderKey(p)]; },
  },
};

export function getManualUrl(cat, p) {
  var tree = MANUAL_TREE[cat];
  if (!tree || !p) return folderUrl(MANUAL_TREE._id);
  var best = tree._id || MANUAL_TREE._id;
  var path = tree._lookup(p), node = tree;
  for (var i = 0; i < path.length; i++) {
    var k = path[i]; if (!k || !node[k]) break;
    node = node[k]; if (node._id) best = node._id;
  }
  return folderUrl(best);
}
