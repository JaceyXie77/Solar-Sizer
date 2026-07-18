/** DeepFind — PowMr Product Selection Tool */
// COLLECTION MECHANISM
// ============================================================
import { state, saveCollection, loadCollection } from '../state.js';
import { esc, findProduct, getCollectionSummary, findProductAny, findProductCat } from '../utils/helpers.js';
import { getManualUrl, folderUrl, MANUAL_TREE } from '../logic/manuals.js';
import { CAT_INV_EU, CAT_INV_US } from '../data/inverters.js';
import { CAT_BAT, CAT_CELLS } from '../data/batteries.js';
import { CAT_CTRL } from '../data/controllers.js';
import { CAT_ESS } from '../data/ess.js';

let _collectLock=0;    // Prevent double-fire of toggleCollect
let _drawerOpenTime=0; // Prevent immediate close after open (race condition)

export function toggleCollect(cat,model,st){
  const now=Date.now();
  // Guard: ignore clicks within 200ms of the last toggle (prevents double-fire from DOM rebuilds)
  if(now-_collectLock<200)return;
  _collectLock=now;

  const key=cat+'|'+model;
  const idx=state.collection.findIndex(item=>(item.cat+'|'+item.model)===key);
  if(idx>=0){state.collection.splice(idx,1);state.selectedItems.delete(key);window.toast('Removed from collection','info')}
  else{
    if(state.collection.length>=20){window.toast('Collection full (max 20 items)','error');return}
    state.collection.push({cat:cat,model:model,st:st||'',addedAt:Date.now()});
    window.toast('Added to collection','success');
  }
  saveCollection();updateColBadge();
  // Re-render current view
  if(state.viewMode==='catalog')window.renderCat();
}
export function isCollected(cat,model){
  return state.collection.some(item=>(item.cat+'|'+item.model)===(cat+'|'+model));
}
export function openDrawer(){
  _drawerOpenTime=Date.now();
  state.drawerOpen=true;
  document.getElementById('collectionOverlay').classList.add('open');
  document.getElementById('collectionDrawer').classList.add('open');
  renderDrawerContent();
}
export function closeDrawer(){
  // Guard: prevent the overlay from immediately closing the drawer
  // when it receives the trailing mouseup from the FAB click (race condition)
  if(Date.now()-_drawerOpenTime<200)return;
  state.drawerOpen=false;document.getElementById('collectionOverlay').classList.remove('open');
  document.getElementById('collectionDrawer').classList.remove('open');
}
export function toggleSelectItem(key){
  if(state.selectedItems.has(key))state.selectedItems.delete(key);
  else state.selectedItems.add(key);
  renderDrawerContent();
}
export function selectAllInGroup(cat){
  const items=state.collection.filter(i=>i.cat===cat);
  const allSelected=items.every(i=>state.selectedItems.has(i.cat+'|'+i.model));
  if(allSelected){items.forEach(i=>state.selectedItems.delete(i.cat+'|'+i.model))}
  else{items.forEach(i=>state.selectedItems.add(i.cat+'|'+i.model))}
  renderDrawerContent();
}
export function removeFromCollection(cat,model){
  const key=cat+'|'+model;
  state.collection=state.collection.filter(i=>(i.cat+'|'+i.model)!==key);
  state.selectedItems.delete(key);
  saveCollection();updateColBadge();
  renderDrawerContent();
  if(state.viewMode==='catalog')window.renderCat();
}
export function clearCollection(){
  state.collection=[];state.selectedItems.clear();
  saveCollection();updateColBadge();
  renderDrawerContent();
  if(state.viewMode==='catalog')window.renderCat();
}
export function renderDrawerContent(){
  const body=document.getElementById('colDrawerBody'),footer=document.getElementById('colDrawerFooter');
  if(!body||!footer)return;
  if(!state.collection.length){
    body.innerHTML='<div class="col-empty">No items collected yet.<br><span style="font-size:12px">Browse products and click ★ to add.</span></div>';
    footer.innerHTML='';
    return;
  }
  const groups={inverters:[],controllers:[],batteries:[],lithium:[],ess:[],cells:[]};
  state.collection.forEach(i=>{if(groups[i.cat])groups[i.cat].push(i)});
  const catLabels={inverters:'Inverters',controllers:'Controllers',batteries:'Batteries',lithium:'Lithium Batteries',ess:'ESS',cells:'LiFePO4 Prismatic Cells'};
  let h='';
  for(const [cat,catName] of Object.entries(catLabels)){
    const items=groups[cat]||[];
    if(!items.length)continue;
    const allSelected=items.every(i=>state.selectedItems.has(i.cat+'|'+i.model))&&items.length>0;
    h+=`<div class="col-group"><div class="col-group-title"><span>${catName} (${items.length})</span><span style="font-size:11px;color:var(--orange-500);cursor:pointer;font-weight:400" onclick="selectAllInGroup('${cat}')">${allSelected?'Deselect all':'Select all'}</span></div>`;
    items.forEach(i=>{
      const key=i.cat+'|'+i.model;
      const p=findProduct(i.cat,i.model);
      const sum=getCollectionSummary(i.cat,p);
      const checked=state.selectedItems.has(key);
      h+=`<div class="col-item" onclick="toggleSelectItem('${key}')"><div class="col-item-cb${checked?' checked':''}"></div><div class="col-item-info"><div class="col-item-model">${esc(i.model)}</div>${sum?`<div class="col-item-spec">${sum}</div>`:''}</div><button class="col-item-remove" onclick="event.stopPropagation();removeFromCollection('${i.cat}','${esc(i.model)}')" title="Remove">&times;</button></div>`;
    });
    h+='</div>';
  }
  body.innerHTML=h;
  // Footer buttons
  const selCount=state.selectedItems.size;
  const selCats=new Set();
  state.selectedItems.forEach(k=>{const [c]=k.split('|');selCats.add(c)});
  const canCompare=selCount>=2&&selCount<=4&&selCats.size===1;
  footer.innerHTML=`
    <button class="col-btn col-btn-compare" ${canCompare?'':'disabled'} onclick="${canCompare?'startCompare()':''}">Compare (${selCount})</button>
    <button class="col-btn col-btn-inquire" ${selCount>0?'':'disabled'} onclick="${selCount>0?'openSelectedInquiry()':''}">Inquire Selected (${selCount})</button>
    <button class="col-btn col-btn-clear" onclick="clearCollection()">Clear</button>
  `;
}
export function startCompare(){
  const items=[...state.selectedItems].map(key=>{const[cat,model]=key.split('|');return{cat,model}});
  if(!items.length||items.length<2||items.length>4)return;
  state.viewMode='compare';state.drawerOpen=false;
  document.getElementById('collectionOverlay').classList.remove('open');
  document.getElementById('collectionDrawer').classList.remove('open');
  renderAll();
}

// COMPARISON DIMENSIONS
const COMPARE_FIELDS={
  inverters:[
    {key:'pkw',label:'Rated Power',better:'max'},
    {key:'ov',label:'Output Voltage',better:''},
    {key:'sv',label:'System Voltage',better:''},
    {key:'t',label:'Type',better:''},
    {key:'pa',label:'Parallel Capable',better:''},
    {key:'pv',label:'PV Max Input',better:'max'},
    {key:'voc',label:'PV VOC',better:'max'},
    {key:'cc',label:'Max Charge Current',better:'max'},
    {key:'ip',label:'IP Rating',better:''},
    {key:'sz',label:'Size',better:'min'},
    {key:'wt',label:'Weight',better:'min'},
  ],
  controllers:[
    {key:'ty',label:'Type',better:''},
    {key:'c',label:'Charge Current',better:'max'},
    {key:'sv',label:'System Voltage',better:''},
    {key:'pvoc',label:'PV VOC',better:'max'},
    {key:'pp',label:'PV Max Power',better:'max'},
    {key:'pa',label:'Parallel',better:''},
    {key:'rd',label:'Remote Display',better:''},
    {key:'ip',label:'IP Rating',better:''},
    {key:'sz',label:'Size',better:'min'},
    {key:'wt',label:'Weight',better:'min'},
  ],
  batteries:[
    {key:'ff',label:'Form Factor',better:''},
    {key:'ah',label:'Capacity (Ah)',better:'max'},
    {key:'wh',label:'Capacity (Wh)',better:'max'},
    {key:'sv',label:'System Voltage',better:''},
    {key:'mc',label:'Max Charge',better:'max'},
    {key:'md',label:'Max Discharge',better:'max'},
    {key:'sl',label:'Series Limit',better:'max'},
    {key:'pl',label:'Parallel Limit',better:'max'},
    {key:'cl',label:'Cycle Life',better:'max'},
    {key:'bms',label:'BMS Communication',better:''},
    {key:'ip',label:'IP Rating',better:''},
    {key:'sz',label:'Size',better:'min'},
    {key:'wt',label:'Weight',better:'min'},
  ],
  lithium:[
    {key:'ff',label:'Form Factor',better:''},
    {key:'ah',label:'Capacity (Ah)',better:'max'},
    {key:'wh',label:'Capacity (Wh)',better:'max'},
    {key:'sv',label:'System Voltage',better:''},
    {key:'mc',label:'Max Charge',better:'max'},
    {key:'md',label:'Max Discharge',better:'max'},
    {key:'sl',label:'Series Limit',better:'max'},
    {key:'pl',label:'Parallel Limit',better:'max'},
    {key:'cl',label:'Cycle Life',better:'max'},
    {key:'bms',label:'BMS Communication',better:''},
    {key:'ip',label:'IP Rating',better:''},
    {key:'sz',label:'Size',better:'min'},
    {key:'wt',label:'Weight',better:'min'},
  ],
  ess:[
    {key:'bc',label:'Battery Capacity',better:'max'},
    {key:'pkw',label:'Rated Power',better:'max'},
    {key:'sv',label:'System Voltage',better:''},
    {key:'ov',label:'Output Voltage',better:''},
    {key:'t',label:'Type',better:''},
    {key:'pv',label:'PV Max Input',better:'max'},
    {key:'voc',label:'PV VOC',better:'max'},
    {key:'cc',label:'Max Charge Current',better:'max'},
    {key:'ip',label:'IP Rating',better:''},
    {key:'sz',label:'Size',better:'min'},
    {key:'wt',label:'Weight',better:'min'},
  ],
  cells:[
    {key:'ah',label:'Capacity (Ah)',better:'max'},
    {key:'wh',label:'Capacity (Wh)',better:'max'},
    {key:'sv',label:'Nominal Voltage',better:''},
    {key:'mc',label:'Max Charge Rate',better:''},
    {key:'md',label:'Max Discharge Rate',better:''},
    {key:'sl',label:'Series Limit',better:''},
    {key:'cl',label:'Cycle Life',better:''},
    {key:'sz',label:'Size',better:'min'},
    {key:'wt',label:'Weight',better:'min'},
  ]
};

function extractNum(str){
  // Extract the primary numeric value from a product spec string.
  // Handles: parens (kVA conversions, PV notes), slashes (dual-voltage), plain numbers.
  str=String(str);
  // 1. Take only the part before any parenthesis
  let main=str.indexOf('(')>=0?str.substring(0,str.indexOf('(')).trim():str;
  // 2. Take only the part before any slash (dual-voltage like "12 kW / 10.4kW@208V")
  if(main.indexOf('/')>=0)main=main.substring(0,main.indexOf('/')).trim();
  // 3. Strip all non-numeric except dots, then parse
  return parseFloat(main.replace(/[^0-9.]/g,''))||0;
}
export function renderComparePage(){
  const items=[...state.selectedItems].map(key=>{const[cat,model]=key.split('|');return{cat,model,product:findProduct(cat,model)}});
  items.sort((a,b)=>(a.cat+'|'+a.model).localeCompare(b.cat+'|'+b.model));
  const cat=items[0].cat;
  state.compareItems=items.map(i=>({cat:i.cat,model:i.model}));
  const fields=COMPARE_FIELDS[cat]||[];
  const catNames={inverters:'Inverters',controllers:'Controllers',batteries:'Batteries',lithium:'Lithium Batteries',ess:'ESS',cells:'LiFePO4 Prismatic Cells'};
  
  // Compute best values
  const bests={};
  fields.forEach(f=>{
    if(!f.better)return;
    const vals=items.map(i=>{
      const v=i.product[f.key]||'';
      return extractNum(String(v));
    }).filter(v=>v>0);
    if(!vals.length)return;
    if(f.better==='max')bests[f.key]=Math.max(...vals);
    else bests[f.key]=Math.min(...vals);
  });
  
  let h=`<a class="back-link mb-4" onclick="exitCompare()" style="display:inline-block;cursor:pointer">← Back to Catalog</a>`;
  h+=`<div class="mb-4"><h2 style="font-size:18px;font-weight:700;color:var(--slate-900)">Compare ${catNames[cat]||cat}</h2><p style="font-size:13px;color:var(--slate-500)">${items.length} products side by side</p></div>`;
  
  h+=`<div class="compare-wrap"><table class="compare-table"><thead><tr><th></th>`;
  items.forEach((i,idx)=>{
    h+=`<th><div class="cv-model">${esc(i.model)}</div><div style="font-size:11px;font-weight:400;color:var(--slate-400)">${getCollectionSummary(i.cat,i.product)}</div></th>`;
  });
  h+=`</tr></thead><tbody>`;
  
  fields.forEach(f=>{
    h+=`<tr><td>${f.label}</td>`;
    const vals=items.map(i=>{
      const v=i.product[f.key]||'—';
      return String(v);
    });
    items.forEach((i,idx)=>{
      const v=vals[idx];
      let cls='';
      if(f.better&&bests[f.key]!==undefined){
        const nv=extractNum(String(v));
        if(nv>0&&nv===bests[f.key])cls=' cv-best';
      }
      h+=`<td class="${cls}">${v}</td>`;
    });
    h+=`</tr>`;
  });
  
  h+=`</tbody></table></div>`;

  // Action row
  h+=`<div class="mt-6" style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start;justify-content:center">`;
  items.forEach((i,idx)=>{
    const url=i.product.url||'';
    var pManual=findProductAny(i.model);
    var pCat=i.cat;
    var manualUrl=(pManual&&pCat)?getManualUrl(pCat,pManual):folderUrl(MANUAL_TREE._id);
    h+=`<div class="compare-card-bottom"><div class="compare-card-model">${esc(i.model)}</div><div class="compare-actions">`;
    h+=`<button class="btn btn-sm btn-primary" onclick="openContact('${esc(i.model)}')">Inquire</button>`;
    if(url)h+=`<a href="${url}" target="_blank" rel="noopener" class="btn btn-sm">Product Page</a>`;
    else h+=`<button class="btn btn-sm btn-ghost" disabled style="opacity:.5;cursor:default">Coming Soon</button>`;
    h+=`<a href="${manualUrl}" target="_blank" rel="noopener" class="btn btn-sm btn-ghost">Manual</a>`;
    h+=`<button class="btn btn-sm btn-ghost" onclick="removeFromCompare('${i.cat}|${esc(i.model)}')">Remove</button></div></div>`;
  });
  h+='</div>';
  
  // Batch inquire
  h+=`<div class="catalog-contact-bar mt-6"><div class="ccb-text"><div class="ccb-title">Ready to inquire about these products?</div><div class="ccb-desc">Send one inquiry for all ${items.length} products at once.</div></div><div class="ccb-actions"><button class="btn btn-primary btn-lg" onclick="openCompareInquiry()">Inquire About All →</button></div></div>`;
  
  document.getElementById('contentArea').className='container-wide';
  document.getElementById('contentArea').innerHTML=h;
}

export function exitCompare(){
  state.viewMode='catalog';
  renderAll();
}
export function removeFromCompare(key){
  state.selectedItems.delete(key);
  const items=[...state.selectedItems].map(k=>{const[c,m]=k.split('|');return{cat:c,model:m}});
  if(items.length<2){
    state.viewMode='catalog';
    renderAll();
  }else{
    renderComparePage();
  }
}

// Batch inquiry
export function openBatchInquiry(){
  const items=state.collection.length>0?state.collection:[...state.selectedItems].map(k=>{const[c,m]=k.split('|');return{cat:c,model:m}});
  if(!items.length){window.toast('No items in collection','error');return}
  const productList=items.map(i=>{const p=findProduct(i.cat,i.model);return `- [${i.cat}] ${i.model} (${getCollectionSummary(i.cat,p)})`}).join('\n');
  const pg=document.getElementById('cfProductGroup');
  document.getElementById('cfProduct').value='Batch inquiry: '+items.length+' items';
  pg.style.display='';
  document.getElementById('cfProductList').value=productList;
  renderProductListPreview(items);
  document.getElementById('contactModal').classList.add('open');
  closeDrawer();
}
export function openSelectedInquiry(){
  const items=[...state.selectedItems].map(k=>{const[c,m]=k.split('|');return{cat:c,model:m}});
  if(!items.length){window.toast('No items selected','error');return}
  const productList=items.map(i=>{const p=findProduct(i.cat,i.model);return `- [${i.cat}] ${i.model} (${getCollectionSummary(i.cat,p)})`}).join('\n');
  const pg=document.getElementById('cfProductGroup');
  document.getElementById('cfProduct').value='Inquiry: '+items.length+' selected items';
  pg.style.display='';
  document.getElementById('cfProductList').value=productList;
  renderProductListPreview(items);
  document.getElementById('contactModal').classList.add('open');
  closeDrawer();
}
export function openCompareInquiry(){
  const items=state.compareItems||[];
  if(!items.length){window.toast('No products to compare','error');return}
  const productList=items.map(i=>{const p=findProduct(i.cat,i.model);return `- [${i.cat}] ${i.model} (${getCollectionSummary(i.cat,p)})`}).join('\n');
  const pg=document.getElementById('cfProductGroup');
  document.getElementById('cfProduct').value='Inquiry: '+items.length+' compared items';
  pg.style.display='';
  document.getElementById('cfProductList').value=productList;
  renderProductListPreview(items);
  document.getElementById('contactModal').classList.add('open');
}
export function renderProductListPreview(items){
  const el=document.getElementById('cfProductPreview');
  if(!el)return;
  let h='<div class="cf-product-preview"><h4>Products in this inquiry ('+items.length+')</h4><div class="cf-product-tags">';
  items.forEach(i=>{
    h+=`<span class="cf-product-tag">${esc(i.model)} <button class="cf-tag-remove" onclick="removeFromInquiry('${i.cat}|${esc(i.model)}')">&times;</button></span>`;
  });
  h+='</div></div>';
  el.innerHTML=h;
  el.style.display='';
}
export function removeFromInquiry(key){
  const[cat,model]=key.split('|');
  state.collection=state.collection.filter(i=>(i.cat+'|'+i.model)!==key);
  state.selectedItems.delete(key);
  saveCollection();updateColBadge();
  // Update form
  if(state.collection.length){
    const items=state.collection;
    document.getElementById('cfProduct').value='Batch inquiry: '+items.length+' items';
    const productList=items.map(i=>{const p=findProduct(i.cat,i.model);return '- ['+i.cat+'] '+i.model+' ('+getCollectionSummary(i.cat,p)+')'}).join('\n');
    document.getElementById('cfProductList').value=productList;
    renderProductListPreview(items);
  }else{
    document.getElementById('contactModal').classList.remove('open');
    closeDrawer();
  }
}

// Update badge
export function updateColBadge(){
  const fab=document.getElementById('collectionFab'),badge=document.getElementById('colBadge');
  if(!fab||!badge)return;
  const n=state.collection.length;
  if(n>0){fab.style.display='';badge.style.display='';badge.textContent=n}
  else{fab.style.display='none';badge.style.display='none'}
  // Also re-render drawer if open
  if(state.drawerOpen)renderDrawerContent();
}

// ============================================================

export function renderAll(){
  document.getElementById('stepIndicatorWrap').style.display=(state.viewMode==='wizard')?'':'none';
  switch(state.viewMode){
    case 'landing':window.renderLanding();break;case 'wizard':window.renderWiz();break;case 'catalog':window.renderCat();break;case 'compare':renderComparePage();break;
  }
}

// ============================================================
