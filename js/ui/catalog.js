/** DeepFind — PowMr Product Selection Tool */
// PRODUCT CATALOG PAGE (B-end)
// ============================================================

import { state } from '../state.js';
import { esc, lowCTA } from '../utils/helpers.js';
import { getFiltered, getAvailCounts, applySingleFilter, optEl } from '../logic/filters.js';
import { getManualUrl, folderUrl, MANUAL_TREE } from '../logic/manuals.js';
import { CAT_INV_EU, CAT_INV_US } from '../data/inverters.js';
import { CAT_BAT, CAT_CELLS } from '../data/batteries.js';
import { CAT_CTRL } from '../data/controllers.js';
import { CAT_ESS } from '../data/ess.js';

export function renderCat(){
  const area=document.getElementById('contentArea');area.className='container-wide';
  area.innerHTML='<a class="back-link" onclick="window.goL()">\u2190 Back to Home</a>'+renderCTabs()+renderCFilters()+'<div id="catalog-products">'+renderCProds()+'</div>'+renderCCBar();
  updateCCnt();
}
export function renderCTabs(){
  const tabs=[{id:'inverters',label:'Inverters'},{id:'lithium',label:'Lithium Batteries'},{id:'ess',label:'Energy Storage System (ESS)'},{id:'controllers',label:'Controllers'}];
  return `<div class="catalog-tabs">${tabs.map(t=>`<button class="catalog-tab ${state.catalogTab===t.id?'active':''}" onclick="setCTab('${t.id}')">${t.label}</button>`).join('')}</div>`;
}
export function setCTab(t){try{state.catalogTab=t;renderCat();var at=document.querySelector('.catalog-tab.active');if(at)at.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'})}catch(e){console.error('setCTab error:',e);alert('Error switching tab: '+e.message)}}

export function renderCFilters(){
  const tab=state.catalogTab,f=state.catalogFilters[tab];
  const srchHTML=`<div class="catalog-search-row"><div class="search-wrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input type="text" placeholder="Search by model..." value="${f.search||''}" oninput="setCF('search',this.value)" id="catalogSearchInput">${f.search?`<button class="search-clear" onclick="clearSearch()" title="Clear search">&times;</button>`:''}</div><select class="sort-select" onchange="setCF('sort',this.value)"><option value="" ${f.sort===''?'selected':''}>Sort: Default</option>${tab==='inverters'?`<option value="power-asc" ${f.sort==='power-asc'?'selected':''}>Power \u2191</option><option value="power-desc" ${f.sort==='power-desc'?'selected':''}>Power \u2193</option>`:tab==='lithium'?`<option value="ah-asc" ${f.sort==='ah-asc'?'selected':''}>Capacity \u2191</option><option value="ah-desc" ${f.sort==='ah-desc'?'selected':''}>Capacity \u2193</option>`:tab==='ess'?`<option value="kwh-asc" ${f.sort==='kwh-asc'?'selected':''}>Energy \u2191</option><option value="kwh-desc" ${f.sort==='kwh-desc'?'selected':''}>Energy \u2193</option>`:`<option value="current-asc" ${f.sort==='current-asc'?'selected':''}>Current \u2191</option><option value="current-desc" ${f.sort==='current-desc'?'selected':''}>Current \u2193</option>`}</select><button class="filter-reset-btn" onclick="resetFilters()" title="Reset all filters">\u21ba Reset</button></div>`;

  if(tab==='inverters'){
    const tC=getAvailCounts('inverters','type'),ipC=getAvailCounts('inverters','ip');
    return srchHTML+`<div class="catalog-filters"><div class="filter-group"><label>Standard</label><select onchange="setCF('standard',this.value)"><option value="" ${f.standard===''?'selected':''}>All Standards</option><option value="eu" ${f.standard==='eu'?'selected':''}>EU (230V)</option><option value="us" ${f.standard==='us'?'selected':''}>US (110/120V)</option></select></div><div class="filter-group"><label>Type</label><select onchange="setCF('type',this.value)">${optEl('','All Types',tC.counts,f.type)}${optEl('all-in-one','All-in-one',tC.counts,f.type)}${optEl('split-phase','Split-phase',tC.counts,f.type)}${optEl('low-freq','Low-frequency',tC.counts,f.type)}${optEl('power-inv','Power inverter',tC.counts,f.type)}${optEl('batteryless','Batteryless',tC.counts,f.type)}</select></div><div class="filter-group"><label>IP Rating</label><select onchange="setCF('ip',this.value)">${optEl('','All Ratings',ipC.counts,f.ip)}${optEl('ip20','IP20 (Indoor)',ipC.counts,f.ip)}${optEl('ip65','IP65 (Outdoor)',ipC.counts,f.ip)}</select></div><div class="filter-count"><span id="ccnt">\u2014</span> inverters</div></div>`;
  }
  if(tab==='controllers'){
    const tyC=getAvailCounts('controllers','type');
    return srchHTML+`<div class="catalog-filters"><div class="filter-group"><label>Type</label><select onchange="setCF('type',this.value)">${optEl('','All Types',tyC.counts,f.type)}${optEl('mppt','MPPT',tyC.counts,f.type)}${optEl('pwm','PWM',tyC.counts,f.type)}</select></div><div class="filter-count"><span id="ccnt">\u2014</span> controllers</div></div>`;
  }
  if(tab==='lithium'){
    const svC=getAvailCounts('lithium','voltage');const catC=getAvailCounts('lithium','category');
    return srchHTML+`<div class="catalog-filters"><div class="filter-group"><label>Voltage</label><select onchange="setCF('voltage',this.value)">${optEl('','All Voltages',svC.counts,f.voltage)}${optEl('12V','12.8V',svC.counts,f.voltage)}${optEl('25V','25.6V',svC.counts,f.voltage)}${optEl('48V','51.2V',svC.counts,f.voltage)}</select></div><div class="filter-group"><label>Battery Category</label><select onchange="setCF('category',this.value)">${optEl('','All Categories',catC.counts,f.category)}${optEl('lead-acid','Lead-Acid Replacement',catC.counts,f.category)}${optEl('residential','Residential Energy Storage',catC.counts,f.category)}${optEl('cells','LiFePO4 Prismatic Cells',catC.counts,f.category)}</select></div><div class="filter-count"><span id="ccnt">\u2014</span> batteries</div></div>`;
  }
  if(tab==='ess'){
    return srchHTML+`<div class="catalog-filters"><div class="filter-group"><label>Standard</label><select onchange="setCF('standard',this.value)"><option value="" ${f.standard===''?'selected':''}>All Standards</option><option value="eu" ${f.standard==='eu'?'selected':''}>EU (230V)</option><option value="us" ${f.standard==='us'?'selected':''}>US (110/120V)</option></select></div><div class="filter-count"><span id="ccnt">\u2014</span> ESS systems</div></div>`;
  }

  return '';
}
export function setCF(k,v){try{const tab=state.catalogTab,flt=state.catalogFilters[tab];flt[k]=v;if(k==='search'){renderProductsOnly();const sw=document.querySelector('.search-wrap');if(sw){let btn=sw.querySelector('.search-clear');if(v&&!btn){btn=document.createElement('button');btn.className='search-clear';btn.title='Clear search';btn.innerHTML='&times;';btn.onclick=clearSearch;sw.appendChild(btn)}else if(!v&&btn){btn.remove()}}return}if(k==='sort'){renderProductsOnly();return}renderCat()}catch(e){console.error('setCF error:',e)}}
export function clearSearch(){const f=state.catalogFilters[state.catalogTab];f.search='';renderCat();}
export function resetFilters(){state.catalogFilters[state.catalogTab]={search:'',sort:''};renderCat();}
export function renderProductsOnly(){const el=document.getElementById('catalog-products');if(el)el.innerHTML=renderCProds();updateCCnt();}

export function getGuidance(tab){
  const f=state.catalogFilters[tab];
  const tips=[];
  if(tab==='inverters'){
    if(f.standard==='eu'&&f.type==='split-phase')tips.push('Split-phase inverters are only available in the US standard. Try switching to US or select a different type.');
  }
  if(tab==='lithium'){
    if(f.category==='high-voltage'&&f.voltage==='12V')tips.push('12.8V options are Lead-Acid Replacement only.');
  }
  if(tab==='controllers'){
    // Controllers simplified to Type only
  }
  if(tab==='ess'){
    // ESS filters simplified to Standard only
  }
  if(!tips.length&&f.search)tips.push('No products with "'+f.search+'" in model name. Try a different search term.');
  if(!tips.length)tips.push('No products match the current filter combination. Try broadening one or more filters.');
  return tips.map(t=>'<p>\u2022 '+t+'</p>').join('');
}

export function hasActiveFilter(tab){
  const f=state.catalogFilters[tab];
  for(const [k,v] of Object.entries(f)){if(k==='sort')continue;if(v)return true}
  return false;
}

export function renderCProds(){
  const products=getFiltered(),tab=state.catalogTab;
  if(!products.length)return `<div class="empty-state"><p class="text-slate-500 font-semibold mb-2">No products match your filters</p><div class="guidance-hint info" style="text-align:left;max-width:560px;margin:0 auto">${getGuidance(tab)}</div><div class="no-match-cta"><div class="nmc-inner"><div class="nmc-icon">\ud83d\udd0d</div><div class="nmc-text"><p class="nmc-title">Can't find what you're looking for?</p><p class="nmc-desc">Our team can help with custom specifications, bulk orders, or products not listed in our catalog.</p></div><button class="btn btn-primary btn-lg" onclick="window.openContact('')">Contact Us for Custom Solutions \u2192</button></div></div></div>`;
  if(tab==='inverters'){
    return `<div class="catalog-grid">${products.map(p=>`<div class="product-card"><div class="pc-accent"></div><div class="pc-header"><span class="pc-model">${p.m}</span><div class="pc-badges"><span class="badge ${p.st==='eu'?'badge-blue':'badge-orange'}">${p.st.toUpperCase()}</span>${p.pa!=='No'?'':'<span class="badge badge-green">Parallel</span>'}${p.ip&&p.ip.includes('IP65')?'<span class="badge badge-teal" title="'+esc(p.ip)+'">IP65</span>':''}</div></div><div class="pc-specs"><div class="pc-spec-row"><span class="pc-spec-label">Output Voltage</span><span class="pc-spec-value">${p.ov}</span></div><div class="pc-spec-row"><span class="pc-spec-label">Rated Power</span><span class="pc-spec-value">${p.pkw}</span></div><div class="pc-spec-row"><span class="pc-spec-label">System Voltage</span><span class="pc-spec-value">${p.sv}</span></div>${p.t.toLowerCase().includes('power inverter')?'':'<div class="pc-spec-row"><span class="pc-spec-label">PV Max Input</span><span class="pc-spec-value">'+p.pv+'</span></div>'}${p.t.toLowerCase().includes('batteryless')||p.t.toLowerCase().includes('power inverter')?'':'<div class="pc-spec-row"><span class="pc-spec-label">Max Charge</span><span class="pc-spec-value">'+p.cc+'</span></div>'}<div class="pc-spec-row"><span class="pc-spec-label">Size / Weight</span><span class="pc-spec-value">${p.sz} / ${p.wt}</span></div></div><div class="pc-actions"><a href="${getManualUrl('inverters',p)}" target="_blank" rel="noopener" class="pc-btn-manual">Manual</a>${p.url?`<a href="${p.url}" target="_blank" rel="noopener" class="pc-btn-product">Product Page</a>`:`<button class="pc-btn-product pc-btn-disabled" disabled>Coming Soon</button>`}<button class="pc-btn-contact" onclick="window.openContact('${p.m}')">Contact Us</button><button class="pc-btn-collect ${window.isCollected('inverters',p.m)?'collected':''}" onclick="event.stopPropagation();window.toggleCollect('inverters','${p.m}','${p.st}')" title="${window.isCollected('inverters',p.m)?'Remove from collection':'Add to collection'}">${window.isCollected('inverters',p.m)?'\u2605':'\u2606'}</button></div></div>`).join('')}</div>${products.length<=2&&!hasActiveFilter('inverters')?lowCTA():''}`;
  }
  if(tab==='controllers'){
    return `<div class="catalog-grid">${products.map(p=>`<div class="product-card"><div class="pc-accent"></div><div class="pc-header"><span class="pc-model">${p.m}</span><div class="pc-badges">${p.ty.split(',').map(tt=>{const t=tt.trim().toLowerCase();const cls=t==='pwm'?'badge-orange':t==='boost'?'badge-purple':'badge-blue';return '<span class="badge '+cls+'">'+tt.trim()+'</span>'}).join('')}${p.rd!=='No'?'<span class="badge badge-purple">Display</span>':''}${p.ip&&p.ip!=='IP20'?`<span class="badge badge-teal">${p.ip}</span>`:''}</div></div><div class="pc-specs"><div class="pc-spec-row"><span class="pc-spec-label">Charge Current</span><span class="pc-spec-value">${p.c}A</span></div><div class="pc-spec-row"><span class="pc-spec-label">System Voltage</span><span class="pc-spec-value">${p.sv}</span></div><div class="pc-spec-row"><span class="pc-spec-label">PV Max VOC</span><span class="pc-spec-value">${p.voc}</span></div><div class="pc-spec-row"><span class="pc-spec-label">PV Max Power</span><span class="pc-spec-value">${p.pp}</span></div><div class="pc-spec-row"><span class="pc-spec-label">Parallel</span><span class="pc-spec-value">${p.pa}</span></div><div class="pc-spec-row"><span class="pc-spec-label">IP Rating</span><span class="pc-spec-value">${p.ip||'\u2014'}</span></div><div class="pc-spec-row"><span class="pc-spec-label">Size / Weight</span><span class="pc-spec-value">${p.sz} / ${p.wt}</span></div></div><div class="pc-actions"><a href="${getManualUrl('controllers',p)}" target="_blank" rel="noopener" class="pc-btn-manual">Manual</a>${p.url?`<a href="${p.url}" target="_blank" rel="noopener" class="pc-btn-product">Product Page</a>`:`<button class="pc-btn-product pc-btn-disabled" disabled>Coming Soon</button>`}<button class="pc-btn-contact" onclick="window.openContact('${p.m}')">Contact Us</button><button class="pc-btn-collect ${window.isCollected('controllers',p.m)?'collected':''}" onclick="event.stopPropagation();window.toggleCollect('controllers','${p.m}')" title="${window.isCollected('controllers',p.m)?'Remove from collection':'Add to collection'}">${window.isCollected('controllers',p.m)?'\u2605':'\u2606'}</button></div></div>`).join('')}</div>${products.length<=2&&!hasActiveFilter('controllers')?lowCTA():''}`;
  }
  if(tab==='lithium'){
    return `<div class="catalog-grid">${products.map(p=>{
      const isCell=p.ct==='cell';
      if(isCell){
        return `<div class="product-card"><div class="pc-accent"></div><div class="pc-header"><span class="pc-model">${p.m}</span><div class="pc-badges"><span class="badge badge-teal">${p.ff}</span></div></div><div class="pc-specs"><div class="pc-spec-row"><span class="pc-spec-label">Capacity</span><span class="pc-spec-value">${p.ah}Ah / ${p.wh}</span></div><div class="pc-spec-row"><span class="pc-spec-label">Nominal Voltage</span><span class="pc-spec-value">${p.sv}</span></div><div class="pc-spec-row"><span class="pc-spec-label">Max Charge / Discharge</span><span class="pc-spec-value">${p.mc} / ${p.md}</span></div><div class="pc-spec-row"><span class="pc-spec-label">Series Limit</span><span class="pc-spec-value">${p.sl}</span></div><div class="pc-spec-row"><span class="pc-spec-label">Cycle Life</span><span class="pc-spec-value">${p.cl}</span></div><div class="pc-spec-row"><span class="pc-spec-label">Size / Weight</span><span class="pc-spec-value">${p.sz} / ${p.wt}</span></div></div><div class="pc-actions">${p.url?`<a href="${p.url}" target="_blank" rel="noopener" class="pc-btn-product">Product Page</a>`:`<button class="pc-btn-product pc-btn-disabled" disabled>Coming Soon</button>`}<button class="pc-btn-contact" onclick="window.openContact('${p.m}')">Contact Us</button><button class="pc-btn-collect ${window.isCollected('cells',p.m)?'collected':''}" onclick="event.stopPropagation();window.toggleCollect('cells','${esc(p.m)}')" title="${window.isCollected('cells',p.m)?'Remove from collection':'Add to collection'}">${window.isCollected('cells',p.m)?'\u2605':'\u2606'}</button></div></div>`;
      }
      return `<div class="product-card"><div class="pc-accent"></div><div class="pc-header"><span class="pc-model">${p.m}</span><div class="pc-badges"><span class="badge badge-blue">${p.ff}</span>${p.ip&&p.ip.includes('IP65')?'<span class="badge badge-teal" title="'+esc(p.ip)+'">IP65</span>':''}</div></div><div class="pc-specs"><div class="pc-spec-row"><span class="pc-spec-label">Capacity</span><span class="pc-spec-value">${p.ah}Ah / ${p.wh}</span></div><div class="pc-spec-row"><span class="pc-spec-label">System Voltage</span><span class="pc-spec-value">${p.sv}</span></div><div class="pc-spec-row"><span class="pc-spec-label">Max Charge / Discharge</span><span class="pc-spec-value">${p.mc}A / ${p.md}A</span></div><div class="pc-spec-row"><span class="pc-spec-label">Series / Parallel Limit</span><span class="pc-spec-value">${p.sl}S / ${p.pl}P</span></div><div class="pc-spec-row"><span class="pc-spec-label">Cycle Life</span><span class="pc-spec-value">${p.cl}</span></div><div class="pc-spec-row"><span class="pc-spec-label">BMS Communication</span><span class="pc-spec-value">${p.bms}</span></div><div class="pc-spec-row"><span class="pc-spec-label">Size / Weight</span><span class="pc-spec-value">${p.sz} / ${p.wt}</span></div></div><div class="pc-actions"><a href="${getManualUrl('lithium',p)}" target="_blank" rel="noopener" class="pc-btn-manual">Manual</a>${p.url?`<a href="${p.url}" target="_blank" rel="noopener" class="pc-btn-product">Product Page</a>`:`<button class="pc-btn-product pc-btn-disabled" disabled>Coming Soon</button>`}<button class="pc-btn-contact" onclick="window.openContact('${p.m}')">Contact Us</button><button class="pc-btn-collect ${window.isCollected('lithium',p.m)?'collected':''}" onclick="event.stopPropagation();window.toggleCollect('lithium','${p.m}')" title="${window.isCollected('lithium',p.m)?'Remove from collection':'Add to collection'}">${window.isCollected('lithium',p.m)?'\u2605':'\u2606'}</button></div></div>`;
    }).join('')}</div>${products.length<=2&&!hasActiveFilter('lithium')?lowCTA():''}`;
  }
  if(tab==='ess'){
    return `<div class="catalog-grid">${products.map(p=>`<div class="product-card"><div class="pc-accent"></div><div class="pc-header"><span class="pc-model">${p.m}</span><div class="pc-badges"><span class="badge ${p.st==='eu'?'badge-blue':'badge-orange'}">${p.st.toUpperCase()}</span></div></div><div class="pc-specs"><div class="pc-spec-row"><span class="pc-spec-label">Battery Capacity</span><span class="pc-spec-value">${p.bc}</span></div><div class="pc-spec-row"><span class="pc-spec-label">PV VOC</span><span class="pc-spec-value">${p.voc}</span></div><div class="pc-spec-row"><span class="pc-spec-label">Output Voltage</span><span class="pc-spec-value">${p.ov}</span></div><div class="pc-spec-row"><span class="pc-spec-label">Rated Power</span><span class="pc-spec-value">${p.pkw}</span></div><div class="pc-spec-row"><span class="pc-spec-label">System Voltage</span><span class="pc-spec-value">${p.sv}</span></div><div class="pc-spec-row"><span class="pc-spec-label">Size / Weight</span><span class="pc-spec-value">${p.sz} / ${p.wt}</span></div></div><div class="pc-actions"><a href="${getManualUrl('ess',p)}" target="_blank" rel="noopener" class="pc-btn-manual">Manual</a>${p.url?`<a href="${p.url}" target="_blank" rel="noopener" class="pc-btn-product">Product Page</a>`:`<button class="pc-btn-product pc-btn-disabled" disabled>Coming Soon</button>`}<button class="pc-btn-contact" onclick="window.openContact('${p.m}')">Contact Us</button><button class="pc-btn-collect ${window.isCollected('ess',p.m)?'collected':''}" onclick="event.stopPropagation();window.toggleCollect('ess','${p.m}')" title="${window.isCollected('ess',p.m)?'Remove from collection':'Add to collection'}">${window.isCollected('ess',p.m)?'\u2605':'\u2606'}</button></div></div>`).join('')}</div>${products.length>4?lowCTA():''}`;
  }
  return '';
}

export function updateCCnt(){
  const el=document.getElementById('ccnt');
  if(el)el.textContent=getFiltered().length;
}

export function renderCCBar(){
  return `<div class="catalog-contact-bar"><div class="ccb-text"><div class="ccb-title">Need help finding the right product?</div><div class="ccb-desc">Our sales team is ready to assist with technical specifications, bulk pricing, and custom configurations.</div><a href="mailto:support@powmr.com" class="ccb-email">\u2709 support@powmr.com</a></div><div class="ccb-actions"><button class="btn btn-primary btn-lg" onclick="window.openContact('')">GET A QUOTE \u2192</button></div></div>`;
}
