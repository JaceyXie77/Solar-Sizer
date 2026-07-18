// ============================================================
// IDEA LAB — User feedback & product suggestions panel
// ============================================================
import { state } from '../state.js';

const IDEA_PLACEHOLDERS = [
  "I wish PowMr could...",
  "What if the battery could also...",
  "In my solar setup I really need...",
  "The one thing missing from inverters is...",
  "My ideal off-grid system would...",
  "If you made a controller that could..."
];

let _ideaPlcIdx = 0, _ideaPlcTmr = null;

function toast(msg, type) {
  const t = document.createElement('div');
  t.className = 'toast toast-' + type;
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(function() { t.classList.add('toast-show'); });
  setTimeout(function() { t.classList.remove('toast-show'); setTimeout(function() { t.remove(); }, 400); }, 3500);
}

function buildIdeaPanel() {
  return '<div class="idea-panel-header"><span class="idea-panel-title">Idea Lab</span><button class="idea-panel-close" onclick="closeIdeaPanel()">\u00d7</button></div><div class="idea-panel-body" id="ideaPanelBody"><p class="idea-subtitle">Your idea could shape our <strong>next product</strong>. Every thought counts.</p><div class="idea-field"><label class="idea-label">I want to talk about... <span class="required">*</span></label><select class="idea-select" id="ideaCategory" required onchange="saveIdeaDraft()"><option value="" selected disabled hidden>I want to talk about...</option><option value="Product Feedback">Product Feedback</option><option value="Feature Request">Feature Request</option><option value="Service Experience">Service Experience</option><option value="Open Talk">Open Talk</option></select></div><div class="idea-field"><label class="idea-label">Your idea <span class="required">*</span></label><textarea class="idea-textarea" id="ideaContent" placeholder="' + IDEA_PLACEHOLDERS[0] + '" maxlength="2000" required oninput="saveIdeaDraft()"></textarea></div><div class="idea-field"><label class="idea-label">Email (optional \u2014 we might reply)</label><input type="email" class="idea-input" id="ideaEmail" placeholder="your@email.com" oninput="saveIdeaDraft()"></div><button class="idea-submit-btn" onclick="submitIdea(event)">Help Build the Future</button><p class="idea-privacy">Your idea is private &amp; only used for product improvement.</p></div>';
}

export function initIdeaBubble() {
  if (document.getElementById('ideaBubble')) return;
  const b = document.createElement('button');
  b.id = 'ideaBubble';
  b.className = 'idea-bubble';
  b.innerHTML = '<span class="idea-bubble-text">Share Your Ideas</span>';
  b.title = 'Your idea could shape our next product.';
  b.onclick = openIdeaPanel;
  document.body.appendChild(b);

  const o = document.createElement('div');
  o.id = 'ideaOverlay';
  o.className = 'idea-overlay';
  o.onclick = closeIdeaPanel;
  document.body.appendChild(o);

  const p = document.createElement('div');
  p.id = 'ideaPanel';
  p.className = 'idea-panel';
  p.innerHTML = buildIdeaPanel();
  document.body.appendChild(p);
}

export function openIdeaPanel() {
  document.getElementById('ideaOverlay').classList.add('show');
  document.getElementById('ideaPanel').classList.add('open');
  document.body.style.overflow = 'hidden';
  if (!_ideaPlcTmr) { _ideaPlcTmr = setInterval(rotatePlc, 4000); }
  restoreIdeaDraft();
}

export function closeIdeaPanel() {
  document.getElementById('ideaOverlay').classList.remove('show');
  document.getElementById('ideaPanel').classList.remove('open');
  document.body.style.overflow = '';
  if (_ideaPlcTmr) { clearInterval(_ideaPlcTmr); _ideaPlcTmr = null; }
}

function rotatePlc() {
  const ta = document.getElementById('ideaContent');
  if (!ta || document.activeElement === ta) return;
  _ideaPlcIdx = (_ideaPlcIdx + 1) % IDEA_PLACEHOLDERS.length;
  ta.placeholder = IDEA_PLACEHOLDERS[_ideaPlcIdx];
}

export function resetIdeaForm() {
  try { localStorage.removeItem('powmr_idea_draft'); } catch(e) {}
  const c = document.getElementById('ideaCategory'), t = document.getElementById('ideaContent'), em = document.getElementById('ideaEmail');
  if (c) c.value = '';
  if (t) { t.value = ''; _ideaPlcIdx = 0; t.placeholder = IDEA_PLACEHOLDERS[0]; }
  if (em) em.value = '';
  const b = document.getElementById('ideaPanelBody');
  if (b && !b.querySelector('#ideaCategory')) b.innerHTML = buildIdeaPanel();
}

export function saveIdeaDraft() {
  const c = document.getElementById('ideaCategory'), t = document.getElementById('ideaContent'), em = document.getElementById('ideaEmail');
  try {
    localStorage.setItem('powmr_idea_draft', JSON.stringify({ category: c ? c.value : '', content: t ? t.value : '', email: em ? em.value : '' }));
  } catch(e) {}
}

function restoreIdeaDraft() {
  const b = document.getElementById('ideaPanelBody');
  if (b && !b.querySelector('#ideaCategory')) b.innerHTML = buildIdeaPanel();
  try {
    const d = JSON.parse(localStorage.getItem('powmr_idea_draft') || '{}');
    const c = document.getElementById('ideaCategory'), t = document.getElementById('ideaContent'), em = document.getElementById('ideaEmail');
    if (c && d.category) c.value = d.category;
    if (t && d.content) t.value = d.content;
    if (em && d.email) em.value = d.email;
  } catch(e) {}
}

export function submitIdea(e) {
  const c = document.getElementById('ideaCategory'), t = document.getElementById('ideaContent'), em = document.getElementById('ideaEmail');
  const btn = e ? e.target.closest('.idea-submit-btn') : document.querySelector('.idea-submit-btn');
  if (!c.value) { toast('Please select a category.', 'error'); return; }
  if (!t.value || t.value.trim().length < 10) { toast('Please share a bit more (at least 10 characters).', 'error'); return; }
  if (btn) { btn.disabled = true; btn.innerHTML = '<span>Sending...</span>'; }
  var msg = 'Category: ' + c.value + '\\nPage: ' + state.viewMode + ' / Step ' + state.currentStep + '\\n';
  if (em && em.value.trim()) msg += 'Reply-To: ' + em.value.trim() + '\\n';
  msg += '---\\n' + t.value.trim();
  var fd = new FormData();
  fd.append('name', em && em.value.trim() ? em.value.trim().split('@')[0] : 'Idea Lab User');
  fd.append('email', em && em.value.trim() ? em.value.trim() : 'idea-lab@powmr.com');
  fd.append('_subject', '[Idea Lab] ' + c.value + ' \u2014 ' + t.value.trim().substring(0, 50));
  fd.append('message', msg);
  fetch('https://formspree.io/f/meebdrne', { method: 'POST', body: fd, headers: { 'Accept': 'application/json' } })
    .then(function() { saveIdeaLocal(c.value, t.value.trim(), em ? em.value.trim() : ''); showIdeaSuccess(); })
    .catch(function() { saveIdeaLocal(c.value, t.value.trim(), em ? em.value.trim() : ''); showIdeaSuccess(); });
}

function saveIdeaLocal(cat, txt, email) {
  var ideas = JSON.parse(localStorage.getItem('powmr_ideas') || '[]');
  ideas.push({ category: cat, content: txt, email: email, page: state.viewMode, timestamp: new Date().toISOString() });
  localStorage.setItem('powmr_ideas', JSON.stringify(ideas));
}

function showIdeaSuccess() {
  try { localStorage.removeItem('powmr_idea_draft'); } catch(e) {}
  document.getElementById('ideaPanelBody').innerHTML = '<div class="idea-success"><div class="idea-success-icon"></div><h3>You\'re a builder now</h3><p>Your idea could spark something great.<br>We read every single one.</p><button class="idea-submit-btn" onclick="resetIdeaForm()" style="width:auto;padding:0 28px">Share Another Idea</button></div>';
  setTimeout(function() {
    if (document.getElementById('ideaPanel') && document.getElementById('ideaPanel').classList.contains('open')) closeIdeaPanel();
  }, 3000);
}

// Escape key to close
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && document.getElementById('ideaPanel') && document.getElementById('ideaPanel').classList.contains('open'))
    closeIdeaPanel();
});
