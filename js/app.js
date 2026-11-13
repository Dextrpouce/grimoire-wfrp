import * as R from './rules.js';
import { store } from './store.js';

// ================= Utilitaires =================
const $app = document.getElementById('app');
const dlg = document.getElementById('dlg');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const C = () => store.current();
const avail = (c) => (+c.xp.total || 0) - (+c.xp.spent || 0);
const fmtDate = (t) => new Date(t).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

const ICONS = {
  sheet: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h7M9 9h3"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  bag: '<path d="M9 7.5h6"/><path d="M9.2 7.5C5.5 9.5 4 12.6 4 15.5 4 19 6.8 21 12 21s8-2 8-5.5c0-2.9-1.5-6-5.2-8"/><path d="M9.2 7.5 7.5 3.8c1.6.7 3 .9 4.5.9s2.9-.2 4.5-.9l-1.7 3.7"/><circle cx="12" cy="14.5" r="2.2"/>',
  up: '<path d="M12 3l7 7h-4v6H9v-6H5z"/><path d="M8 21h8"/>',
  book: '<path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4z"/><path d="M20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z"/>',
  cloud: '<path d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 9.5 4.3 4.3 0 0 0 7 18z"/>',
  dots: '<circle cx="12" cy="5" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="12" cy="19" r="1.3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  check: '<path d="M5 12l5 5L20 7"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  down: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
  library: '<path d="M4 4h3v16H4zM9 4h3v16H9z"/><path d="M14.5 5.2l2.9-.8 3.6 14.6-2.9.7z"/>',
  wand: '<path d="M4 20L15 9"/><path d="M17 3v3M15.5 4.5h3M20 8v2M19 9h2M13 4v1.5M12.2 4.8h1.6"/>',
  sword: '<path d="M20 4l-.6 3.4L10 16.8 7.2 14 16.6 4.6z"/><path d="M5.2 12.4l6.4 6.4"/><path d="M8.4 15.6 4.2 19.8"/><circle cx="3.6" cy="20.4" r=".9"/>',
  die: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.2"/><circle cx="15" cy="15" r="1.2"/><circle cx="15" cy="9" r="1.2"/><circle cx="9" cy="15" r="1.2"/>',
  skull: '<path d="M12 3a8 8 0 0 0-8 8c0 3 1.5 4.8 3 5.6V20h10v-3.4c1.5-.8 3-2.6 3-5.6a8 8 0 0 0-8-8z"/><circle cx="9" cy="11" r="1.6"/><circle cx="15" cy="11" r="1.6"/><path d="M11 20v-2M13 20v-2"/>',
};
const icon = (n) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]}</svg>`;

let toastTimer;
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

function commit(rerender = true) {
  C().updatedAt = Date.now();
  store.save();
  if (rerender) render();
}

// ================= État de l'interface =================
const ui = {
  tab: localStorage.getItem('whfrp4.tab') || 'fiche',
  levelUp: false,
  skillFilter: localStorage.getItem('whfrp4.skillFilter') || 'all',
};

const TABS = [
  ['fiche', 'Fiche', 'sheet'], ['sante', 'Combat', 'sword'], ['magie', 'Magie', 'wand'], ['sac', 'Sac', 'bag'],
  ['prog', 'Progrès', 'up'], ['carnet', 'Carnet', 'book'], ['biblio', 'Biblio', 'library'],
];

// ================= Champs de formulaire =================
const F = {
  text: (name, label, val, cls = '', attrs = '') => `<div class="field ${cls}"><label>${label}</label><input name="${name}" value="${esc(val)}" ${attrs}></div>`,
  num: (name, label, val, cls = '', attrs = '') => `<div class="field ${cls}"><label>${label}</label><input type="number" inputmode="numeric" name="${name}" value="${esc(val)}" ${attrs}></div>`,
  area: (name, label, val, cls = 'full') => `<div class="field ${cls}"><label>${label}</label><textarea name="${name}">${esc(val)}</textarea></div>`,
  select: (name, label, val, opts, cls = '') => `<div class="field ${cls}"><label>${label}</label><select name="${name}">${opts.map((o) => {
    const [v, l] = Array.isArray(o) ? o : [o, o];
    return `<option value="${esc(v)}" ${String(v) === String(val) ? 'selected' : ''}>${esc(l)}</option>`;
  }).join('')}</select></div>`,
};
const charOpts = R.CHARS.map((c) => [c.key, `${c.key} — ${c.name}`]);
const num = (v) => (v === '' || v == null || isNaN(+v) ? 0 : +v);

// Champ lié directement au personnage (enregistré à la frappe)
const bind = (path, val, type = 'text', attrs = '') => type === 'area'
  ? `<textarea data-bind="${path}" ${attrs}>${esc(val)}</textarea>`
  : `<input data-bind="${path}" ${type === 'number' ? 'type="number" inputmode="numeric" data-num' : ''} value="${esc(val)}" ${attrs}>`;

function setPath(obj, path, value) {
  const keys = path.split('.');
  let o = obj;
  for (let i = 0; i < keys.length - 1; i++) o = o[keys[i]];
  o[keys.at(-1)] = value;
}

// ================= Dialogues =================
function openDialog({ title, body, actions = [], onOpen }) {
  dlg.innerHTML = `<form class="card" autocomplete="off"><h2>${esc(title)}</h2>${body}<div class="dlg-actions">${actions.map((a, i) => a === 'spacer'
    ? '<span class="spacer"></span>'
    : `<button type="${a.primary ? 'submit' : 'button'}" class="btn ${a.cls || ''}" data-i="${i}">${a.label}</button>`).join('')}</div></form>`;
  const form = dlg.querySelector('form');
  const run = (a) => { const r = a.onClick ? a.onClick(form) : undefined; if (r !== false) dlg.close(); };
  dlg.querySelectorAll('.dlg-actions button').forEach((b) => {
    if (b.type === 'button') b.onclick = () => run(actions[b.dataset.i]);
  });
  form.onsubmit = (e) => { e.preventDefault(); const a = actions.find((x) => x.primary); if (a) run(a); };
  dlg.showModal();
  onOpen?.(form);
}
dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
const cancel = { label: 'Annuler', cls: 'ghost' };

function confirmDialog(title, text, okLabel, onOk) {
  openDialog({ title, body: `<p>${text}</p>`, actions: [cancel, { label: okLabel, primary: true, onClick: onOk }] });
}

// ================= XP =================
function spend(c, cost, label, undo) {
  if (cost > avail(c)) { toast(`Il te manque ${cost - avail(c)} XP`); return false; }
  c.xp.spent = (+c.xp.spent || 0) + cost;
  c.xpLog.unshift({ id: R.uid(), date: Date.now(), kind: 'spend', amount: cost, label, undo });
  return true;
}

function gainXp(c, amount, label) {
  c.xp.total = (+c.xp.total || 0) + amount;
  c.xpLog.unshift({ id: R.uid(), date: Date.now(), kind: 'gain', amount, label: label || 'Gain d\'expérience', undo: { type: 'gain' } });
}

function undoLast(c) {
  const e = c.xpLog.find((x) => !x.undone);
  if (!e) return;
  const u = e.undo || {};
  if (e.kind === 'gain') {
    if (avail(c) < e.amount) { toast('Impossible : cet XP a déjà été dépensé'); return; }
    c.xp.total -= e.amount;
  } else {
    c.xp.spent -= e.amount;
    if (u.type === 'char') c.chars[u.key].advances = Math.max(0, c.chars[u.key].advances - 1);
    if (u.type === 'skill') { const s = c.skills.find((x) => x.id === u.id); if (s) s.advances = Math.max(0, s.advances - 1); }
    if (u.type === 'talent') {
      const i = c.talents.findIndex((t) => R.norm(t.name) === R.norm(u.name));
      if (i >= 0) { c.talents[i].times--; if (c.talents[i].times <= 0) c.talents.splice(i, 1); }
    }
    if (u.type === 'level') c.career.level = u.prev;
    if (u.type === 'career') { c.career = u.prevCareer; c.careerHistory.pop(); if ('prevClass' in u) c.className = u.prevClass; }
  }
  e.undone = true;
  toast(`Annulé : ${e.label}`);
  commit();
}

const plusBtn = (c, cost, act, data, inCareer = true) => (cost <= avail(c)
  ? `<button class="plus ${inCareer ? '' : 'out'}" data-act="${act}" ${data} title="${inCareer ? '' : 'Hors carrière : coût doublé'}">${icon('plus')}${cost}</button>`
  : `<span class="cost-na">${cost} XP</span>`);

// ================= Rendu =================
function render() {
  const c = C();
  if (ui.tab === 'magie' && !R.isCaster(c)) ui.tab = 'carnet';
  const y = window.scrollY;
  $app.innerHTML = `<div class="shell ${ui.levelUp ? 'lvl' : ''}">
    ${topbar(c)}
    ${ui.levelUp ? `<div class="lvl-banner">${icon('star')}<span><b>Mode progression</b> — ${avail(c)} XP à dépenser. Les boutons <b>+</b> dorés apparaissent quand tu as assez d'XP ; les rosés sont hors carrière (coût ×2).</span></div>` : ''}
    <main>${VIEWS[ui.tab](c)}</main>
    <nav class="tabs">${TABS.filter(([k]) => k !== 'magie' || R.isCaster(c)).map(([k, l, i]) => `<button class="${ui.tab === k ? 'active' : ''}" data-act="tab" data-tab="${k}">${icon(i)}<span>${l}</span></button>`).join('')}</nav>
  </div>`;
  window.scrollTo(0, y);
  if (ui.tab === 'biblio' && ui.libSearch) filterLib(ui.libSearch);
}

function topbar(c) {
  const lvl = R.careerLevel(c);
  const title = c.career.levels[lvl - 1]?.title;
  const sub = [c.species, c.career.name, title ? `${title} (échelon ${lvl})` : (c.career.name ? `échelon ${lvl}` : '')].filter(Boolean).join(' · ');
  const st = store.status;
  return `<header class="topbar">
    <button class="who" data-act="characters" aria-label="Changer de personnage">
      <span class="crest">${esc((c.name || '?').trim().charAt(0).toUpperCase())}</span>
      <span class="who-txt"><div class="who-name">${esc(c.name || 'Sans nom')}</div><div class="who-sub">${esc(sub || 'Touchez pour gérer vos personnages')}</div></span>
    </button>
    <button class="lvl-toggle ${ui.levelUp ? 'on' : ''}" data-act="toggleLevelUp">${icon('star')}<span>${avail(c)} XP</span></button>
    <button id="syncBtn" class="icon-btn sync-${st.state}" data-act="syncNow" title="${esc(st.message)}" aria-label="Synchronisation">${icon('cloud')}<span class="sync-dot"></span></button>
    <button class="icon-btn" data-act="menu" aria-label="Menu">${icon('dots')}</button>
  </header>`;
}

// ---------- Fiche ----------
function viewFiche(c) {
  const mv = R.movement(c);
  const chars = R.CHARS.map(({ key, name }) => {
    const ch = c.chars[key];
    const inC = R.charInCareer(c, key);
    const v = R.charValue(c, key);
    const tb = R.talentCharBonus(c, key);
    return `<div class="char ${inC ? 'career' : ''}" data-act="editChar" data-k="${key}" title="${name}${tb.value ? ` — +${tb.value} ${tb.names.join(', ')}` : ''}">
      <span class="ck">${key}</span><span class="cv">${v}</span>
      <span class="cb">${ch.initial}${ch.advances ? ` + ${ch.advances}` : ''}${ch.modifier ? ` ${ch.modifier > 0 ? '+' : ''}${ch.modifier}` : ''}${tb.value ? ` <b class="tal">+${tb.value}★</b>` : ''}</span>
      ${ui.levelUp ? plusBtn(c, R.advanceCost('char', +ch.advances || 0, inC), 'buyChar', `data-k="${key}"`, inC) : ''}
    </div>`;
  }).join('');

  let skills = [...c.skills].sort((a, b) => R.skillLabel(a).localeCompare(R.skillLabel(b), 'fr'));
  if (ui.skillFilter === 'acquired') skills = skills.filter((s) => +s.advances > 0);
  if (ui.skillFilter === 'career') skills = skills.filter((s) => R.skillInCareer(c, s));
  const hints = skillTalentHints(c);
  const skillRows = skills.map((s) => {
    const inC = R.skillInCareer(c, s);
    const adv = +s.advances || 0;
    const h = hints.get(s.id) || [];
    return `<div class="skill ${adv ? '' : 'zero'}" data-act="editSkill" data-id="${s.id}" role="button">
      <span class="sn"><b>${esc(R.skillLabel(s))}</b>${inC ? '<span class="career-mark">◆</span>' : ''}${h.length ? `<span class="talent-mark" title="${esc(h.map((x) => x.name).join(', '))}">★</span>` : ''}</span>
      <span class="sc">${s.char}</span><span class="sa">${adv || '–'}</span><span class="st">${R.skillValue(c, s)}</span>
      ${ui.levelUp ? `<span>${plusBtn(c, R.advanceCost('skill', adv, inC), 'buySkill', `data-id="${s.id}"`, inC)}</span>` : ''}
    </div>`;
  }).join('') || '<div class="empty">Aucune compétence ici.</div>';

  const talents = c.talents.map((t, i) => {
    const inC = R.talentInCareer(c, t.name);
    const info = store.findTalent(t.name);
    const max = R.talentMax(c, info?.max);
    const atMax = max != null && (+t.times || 0) >= max;
    const desc = t.desc || info?.desc || '';
    return `<div class="list-item" data-act="editTalent" data-i="${i}" role="button">
      <span class="badge ${inC ? 'gold' : 'soft'}" title="${max != null ? `Pris ${t.times} fois sur ${max} maximum` : ''}">${t.times}${max != null ? `<small style="opacity:.7">/${max}</small>` : ''}</span>
      <span class="li-main"><div class="li-title">${esc(t.name)}${inC ? ' <span class="career-mark" style="color:var(--gold);font-size:10px">◆</span>' : ''}</div>${desc ? `<div class="li-sub">${esc(desc)}</div>` : ''}${info?.tests && info.tests !== 'Aucun' ? `<div class="small muted">Tests : ${esc(info.tests)}</div>` : ''}</span>
      ${ui.levelUp ? (atMax ? '<span class="cost-na">max</span>' : plusBtn(c, R.talentCost(+t.times || 0, inC), 'buyTalent', `data-i="${i}"`, inC)) : ''}
    </div>`;
  }).join('') || '<div class="empty">Aucun talent pour l\'instant.</div>';

  return `<div class="grid three">
    <section class="card span-2" style="grid-column:1/-1">
      <h2>Caractéristiques</h2>
      <div class="chars">${chars}</div>
      <div class="stats-row">
        <div class="stat" title="${mv.fleet ? `+${mv.fleet} Pieds Légers` : ''}"><div class="sk">Mouvement</div><div class="sv">${mv.move}${mv.fleet ? '<small class="tal">★</small>' : ''}</div></div>
        <div class="stat"><div class="sk">Marche</div><div class="sv">${mv.walk}</div></div>
        <div class="stat"><div class="sk">Course</div><div class="sv">${mv.run}</div></div>
      </div>
      <p class="small muted" style="margin:10px 0 0">Touchez une caractéristique pour la modifier librement. ◆ = dans votre carrière · ★ = bonus de talent.</p>
    </section>
    <section class="card" style="grid-column: span 2">
      <h2>Compétences</h2>
      <div class="filters">
        ${[['all', 'Toutes'], ['acquired', 'Acquises'], ['career', 'Carrière ◆']].map(([k, l]) => `<button class="chip ${ui.skillFilter === k ? 'on' : ''}" data-act="skillFilter" data-f="${k}">${l}</button>`).join('')}
      </div>
      <div class="skills ${ui.levelUp ? '' : 'wide'}" style="--rows:${Math.max(1, Math.ceil(skills.length / 2))}">${skillRows}</div>
      <div class="add-row"><button class="btn ghost small" data-act="addSkill">${icon('plus')} Compétence groupée ou avancée</button></div>
    </section>
    <section class="card">
      <h2>Talents</h2>
      ${talents}
      <div class="add-row"><button class="btn ${ui.levelUp ? 'gold' : 'ghost'} small" data-act="addTalent">${icon('plus')} ${ui.levelUp ? 'Acheter un talent' : 'Ajouter un talent'}</button></div>
    </section>
  </div>`;
}

// ---------- Combat (ancien onglet Santé) ----------
// Gravure de Viollet-le-Duc (1874, domaine public), passée en encre sépia
// Illustration propre à la carrière quand elle existe (img/carrieres), sinon la gravure
const CAREER_FIGURES = {
  chasseur: ['chasseur'], marin: ['marin'], charlatan: ['charlatan'],
  sorcier: ['sorcier', 'sorciere', 'sorcier sauvage', 'sorciere de village'],
};
const WIDE_FIGURES = ['sorcier'];
function figureKey(c) {
  const n = R.norm(c.career?.name);
  return Object.keys(CAREER_FIGURES).find((k) => CAREER_FIGURES[k].includes(n)) || null;
}
function figure(c) {
  const key = figureKey(c);
  return key
    ? `<img class="fig career" src="img/carrieres/${key}.webp" alt="${esc(c.career.name)}" loading="lazy">`
    : '<img class="fig" src="img/armure.webp" alt="" loading="lazy">';
}

function viewSante(c) {
  const wb = R.woundsBreakdown(c);
  const max = wb.total;
  const cur = Math.min(c.health.wounds ?? max, max);
  const pct = max ? Math.max(0, cur / max * 100) : 0;
  const f = c.fate;
  const ap = R.armourPoints(c);
  const adv = +c.health.advantage || 0;
  const mv = R.movement(c);
  const loc = (k) => { const l = R.LOCATIONS.find((x) => x.key === k); return `<div class="loc"><div class="lr">${l.range}</div><div class="lv">${ap[k]}</div><div class="ln">${l.name}</div></div>`; };
  const pips = (total, on, act, red = false) => total
    ? Array.from({ length: total }, (_, i) => `<button class="pip ${red ? 'red' : ''} ${i < on ? 'on' : ''}" data-act="${act}" data-n="${i}" aria-label="point ${i + 1}"></button>`).join('')
    : '<span class="small muted">—</span>';

  // Attaques : chaque arme + les mains nues
  const weapons = [...c.weapons.map((w, i) => ({ w, i })), { w: { name: 'Mains nues', group: 'Bagarre', reach: 'Personnelle', damage: 'BF+0', qualities: 'Inoffensive' }, i: -1 }];
  const tg = combatTalentGroups(c);
  const attacks = weapons.map(({ w, i }) => {
    const ws = R.weaponSkill(c, w);
    const d = R.weaponDamage(c, w);
    const bonus = [];
    if (R.hasQuality(w, 'acc10')) bonus.push(['+10', 'Précise']);
    if (adv) bonus.push([`+${adv * 10}`, 'Avantage']);
    const eff = ws.value + (R.hasQuality(w, 'acc10') ? 10 : 0) + adv * 10;
    const dr = (R.hasQuality(w, 'hit+1') ? 1 : 0) - (R.hasQuality(w, 'hit-1') ? 1 : 0);
    const detail = bonus.length || dr
      ? `<div class="atk-bonus">${bonus.length ? `${ws.value} ${bonus.map(([v, n]) => `<b>${v}</b> ${n}`).join(' ')}` : ''}${dr ? ` <b class="${dr > 0 ? 'pro' : 'con'}">${dr > 0 ? '+' : ''}${dr} DR</b> si touché` : ''}</div>`
      : '';
    return `<div class="attack" data-act="rollAttack" data-i="${i}" role="button">
      <div class="atk-main"><div class="li-title">${esc(w.name)}</div>
        <div class="li-sub">${esc(ws.label)}${w.reach ? ` · ${esc(w.reach)}` : ''}</div>
        ${detail}${qualityTags(w)}${talentTags(c, ws.ranged ? tg.ranged : tg.melee)}</div>
      <div class="atk-num"><span class="atk-val ${ws.trained ? '' : 'untrained'} ${eff !== ws.value ? 'boosted' : ''}">${eff}</span><span class="atk-lbl">${ws.ranged ? 'Tir' : 'Attaque'}</span></div>
      <div class="atk-num"><span class="atk-val dmg">${d != null ? d : esc(w.damage || '–')}</span><span class="atk-lbl">Dégâts</span></div>
      <span class="atk-die">${icon('die')}</span>
    </div>`;
  }).join('');

  // Défense et ordre d'action
  const dodge = c.skills.find((s) => R.norm(s.name) === 'esquive');
  const melee = c.weapons.filter((w) => !R.weaponSkill(c, w).ranged).sort((a, b) => R.weaponSkill(c, b).value - R.weaponSkill(c, a).value || R.hasQuality(b, 'parry+1') - R.hasQuality(a, 'parry+1')).map((w) => R.weaponSkill(c, w))[0]
    || R.weaponSkill(c, { group: 'Base', reach: 'Moyenne' });
  const parryW = c.weapons.filter((w) => !R.weaponSkill(c, w).ranged).sort((a, b) => R.weaponSkill(c, b).value - R.weaponSkill(c, a).value || R.hasQuality(b, 'parry+1') - R.hasQuality(a, 'parry+1'))[0];
  const parryDef = !!parryW && R.hasQuality(parryW, 'parry+1');
  const defense = `<div class="stats-row def-row">
      <div class="stat roll" data-act="rollSkill" data-id="${dodge?.id || ''}" role="button"><div class="sk">Esquive</div><div class="sv">${dodge ? R.skillValue(c, dodge) + adv * 10 : '–'}</div>${dodge && adv ? `<div class="def-bonus">${R.skillValue(c, dodge)} +${adv * 10} Av.</div>` : ''}</div>
      <div class="stat roll" data-act="rollParry" role="button"><div class="sk">Parade</div><div class="sv">${melee.value + adv * 10}</div>${adv || parryDef ? `<div class="def-bonus">${adv ? `${melee.value} +${adv * 10} Av.` : ''}${parryDef ? ' <b>+1 DR</b>' : ''}</div>` : ''}</div>
      ${(() => {
        const ir = c.health.initRoll;
        return ir
          ? `<div class="stat roll init-set" data-act="initiative" role="button"><div class="sk">Initiative</div><div class="sv">${ir.total}</div><div class="def-bonus">BI ${ir.bi}${ir.reflexes ? ` +${ir.reflexes} Réflexes` : ''} + ${ir.die}</div></div>`
          : `<div class="stat roll" data-act="initiative" role="button"><div class="sk">Initiative</div><div class="sv">${icon('die')}</div><div class="def-bonus">Lancer · I ${R.charValue(c, 'I')}</div></div>`;
      })()}
    </div>
    <div class="stats-row" style="margin-top:8px">
      <div class="stat"><div class="sk">Mouvement</div><div class="sv">${mv.move}</div></div>
      <div class="stat"><div class="sk">Marche</div><div class="sv">${mv.walk}</div></div>
      <div class="stat"><div class="sk">Course</div><div class="sv">${mv.run}</div></div>
    </div>`;

  // Talents utiles en combat (d'après la bibliothèque)
  return `<div class="combat-bar">
      <div class="cb-item"><span class="cb-k">Blessures</span>
        <span class="cb-ctrl"><button data-act="wound" data-d="-1">−</button><b class="${cur <= 0 ? 'danger' : ''}">${cur}<small>/${max}</small></b><button data-act="wound" data-d="1">+</button></span></div>
      <div class="cb-item"><span class="cb-k">Avantage</span>
        <span class="cb-ctrl"><button data-act="adv" data-d="-1">−</button><b>${adv}</b><button data-act="adv" data-d="1">+</button></span></div>
      <div class="cb-item"><span class="cb-k">Chance</span>
        <span class="cb-ctrl"><button data-act="fortuneStep" data-d="-1" aria-label="Dépenser 1 point de Chance">−</button><b>${+f.fortune || 0}<small>/${R.maxFortune(c)}</small></b><button data-act="fortuneStep" data-d="1" aria-label="Regagner 1 point de Chance">+</button></span></div>
    </div>
    <div class="grid three combat">
    <div class="stack">
      <section class="card">
        <h2>Attaques</h2>
        ${attacks}
        ${tg.general.length ? `<div class="tal-general"><span class="flabel">Général</span>${talentTags(c, tg.general)}</div>` : ''}
        <p class="small muted" style="margin:8px 0 0">Touche une attaque pour lancer les dés. Touche une pastille ★ pour voir l'effet d'un talent. Gère tes armes dans l'onglet Sac.</p>
      </section>
      <section class="card">
        <h2>Défense</h2>
        ${defense}
        ${tg.defense.length ? `<div class="tal-general">${talentTags(c, tg.defense)}</div>` : ''}
        <div class="add-row"><button class="btn ghost small" data-act="rollFree">${icon('die')} Autre test</button></div>
      </section>
    </div>
    <div class="stack">
      <section class="card wounds">
        <h2>Blessures</h2>
        <div class="big">${cur}<small> / ${max}</small></div>
        <div class="bar"><i style="width:${pct}%"></i></div>
        <div class="wound-btns">
          <button class="btn" data-act="wound" data-d="-5">−5</button><button class="btn" data-act="wound" data-d="-1">−1</button>
          <button class="btn green" data-act="wound" data-d="1">+1</button><button class="btn green" data-act="wound" data-d="5">+5</button>
        </div>
        <div class="row" style="margin-top:10px">
          <button class="btn gold" style="flex:1" data-act="damage">${icon('skull')} Encaisser un coup</button>
          <button class="btn ghost" style="flex:1" data-act="healFull">Soins complets</button>
        </div>
        <div class="breakdown">
          <div class="stat"><div class="sk">BF</div><div class="sv">${wb.sb}</div></div>
          <div class="stat"><div class="sk">BE×2</div><div class="sv">${wb.tb2}</div></div>
          <div class="stat"><div class="sk">BFM</div><div class="sv">${wb.wpb}</div></div>
          <div class="stat"><div class="sk">Dur à cuire</div><div class="sv">${wb.hardy}</div></div>
          <div class="stat" data-act="woundsExtra" role="button"><div class="sk">Autre +</div><div class="sv">${wb.extra}</div></div>
        </div>
      </section>
      <section class="card">
        <h2>Blessures critiques</h2>
        ${c.health.criticals.map((cr, i) => `<div class="list-item"><span class="li-main"><div class="li-title">${esc(cr.name)}</div><div class="li-sub">${esc(cr.location)}${cr.desc ? ` — ${esc(cr.desc)}` : ''}</div></span><button class="icon-btn" style="color:var(--blood)" data-act="healCrit" data-i="${i}" aria-label="Guérie">${icon('check')}</button></div>`).join('') || '<div class="empty">Aucune, pour l\'instant…</div>'}
        <div class="add-row"><button class="btn ghost small" data-act="addCrit">${icon('plus')} Blessure critique</button></div>
      </section>
      <section class="card">
        <h2>Notes de combat</h2>
        ${bind('combatNotes', c.combatNotes, 'area', 'placeholder="États en cours, effets, ennemi ciblé, rappel du MJ…" style="min-height:110px"')}
      </section>
    </div>
    <div class="stack">
      <section class="card">
        <h2>Points d'armure</h2>
        <div class="body-map ${WIDE_FIGURES.includes(figureKey(c)) ? 'wide-fig' : ''}">
          ${loc('tete')}${figure(c)}${loc('brasG')}
          ${loc('brasD')}${loc('corps')}
          ${loc('jambeD')}${loc('jambeG')}
          ${(() => {
            const sh = R.shield(c);
            return `<div class="loc shield-box ${sh ? '' : 'none'}" title="${sh ? `Bouclier ${sh.rating} : ${esc(sh.name)}` : 'Aucun bouclier'}">
              <div class="lr">🛡️ Bouclier</div><div class="lv">${sh ? sh.rating : '—'}</div><div class="ln">${sh ? esc(sh.name) : 'aucun'}</div></div>`;
          })()}
        </div>
        <p class="small muted" style="margin:10px 0 0">Calculés depuis les armures portées (onglet Sac). Le bouclier vient de l'arme qui a l'atout <b>Bouclier</b>.</p>
      </section>
      <section class="card">
        <h2>Destin & Résilience</h2>
        <div class="fate-grid">
          <div class="fate-box"><div class="fk">Destin</div><div class="pips">${pips(+f.fate || 0, +f.fate || 0, 'noop')}</div></div>
          <div class="fate-box"><div class="fk">Chance${R.luckBonus(c) ? ' <span class="tal" title="Talent Chance">★</span>' : ''}</div><div class="pips">${pips(R.maxFortune(c), +f.fortune || 0, 'fortune')}</div></div>
          <div class="fate-box"><div class="fk">Résilience</div><div class="pips">${pips(+f.resilience || 0, +f.resilience || 0, 'noop', true)}</div></div>
          <div class="fate-box"><div class="fk">Détermination${R.strongMindBonus(c) ? ' <span class="tal" title="Talent Fort d\'Esprit">★</span>' : ''}</div><div class="pips">${pips(R.maxResolve(c), +f.resolve || 0, 'resolve', true)}</div></div>
        </div>
        ${f.motivation ? `<p class="small" style="margin:10px 0 0"><b>Motivation :</b> ${esc(f.motivation)}</p>` : ''}
        <div class="row" style="margin-top:10px"><button class="btn ghost small" data-act="newSession">Nouvelle séance (Chance au max)</button></div>
      </section>
    </div>
  </div>
  <div class="combat-end"><button class="btn ghost" data-act="adv" data-d="reset">Fin du combat · Avantage et initiative à 0</button><span class="small muted">+10 par point d'Avantage aux tests de combat (ajouté automatiquement aux jets).</span></div>`;
}

// Bulle d'effet d'une qualité, ouverte au toucher (les infobulles au survol n'existent pas sur tablette)
function showQualityPopover(anchor, q) {
  document.getElementById('qPop')?.remove();
  const pop = document.createElement('div');
  pop.id = 'qPop';
  pop.className = `q-pop ${q.kind === 'atout' ? 'pro' : 'con'}`;
  pop.innerHTML = `<b>${esc(q.name)}</b> <span class="small">(${q.kind})${q.auto ? ' · ⚙ appliqué aux jets' : ''}</span><div>${esc(q.desc)}</div>`;
  document.body.appendChild(pop);
  const r = anchor.getBoundingClientRect();
  const w = Math.min(300, window.innerWidth - 24);
  pop.style.width = `${w}px`;
  pop.style.left = `${Math.max(12, Math.min(r.left + r.width / 2 - w / 2, window.innerWidth - w - 12))}px`;
  const below = r.bottom + 8 + pop.offsetHeight < window.innerHeight - 70;
  pop.style.top = `${below ? r.bottom + 8 : r.top - pop.offsetHeight - 8}px`;
  setTimeout(() => document.addEventListener('pointerdown', () => pop.remove(), { once: true }), 0);
}

// Dans les fenêtres d'édition : l'effet de la pastille cochée ou décochée s'affiche sous les pastilles
function wireQualityHelp(f, list) {
  const box = f.querySelector('.q-help');
  f.querySelectorAll('.q-chip input[type=checkbox]').forEach((cb) => cb.addEventListener('change', () => {
    const q = list.find((x) => x.name === cb.value);
    if (!q || !box) return;
    box.className = `q-help ${q.kind === 'atout' ? 'pro' : 'con'}`;
    box.innerHTML = `<b>${esc(q.name)}</b>${q.auto ? ' ⚙' : ''} : ${esc(q.desc)}`;
  }));
}

// Talents de combat du personnage, rangés selon ce qu'ils concernent (d'après la bibliothèque)
function combatTalentGroups(c) {
  const g = { ranged: [], melee: [], defense: [], general: [] };
  c.talents.forEach((t, i) => {
    if (!(+t.times > 0)) return;
    const info = store.findTalent(t.name);
    // Les « tests associés » priment ; la description ne sert que s'ils sont vides
    const tests = R.norm(info?.tests || '').replace(/^-$/, '');
    const txt = tests || R.norm(info?.desc || t.desc || '');
    const all = R.norm(`${info?.tests || ''} ${info?.desc || t.desc || ''}`);
    let hit = false;
    if (/\btir\b|projectile|a distance|\barc\b|arbalet|poudre noire|recharg/.test(txt)) { g.ranged.push(i); hit = true; }
    if (/melee|corps a corps|escrime|bagarre|\bcharge\b|\bchargez\b/.test(txt)) { g.melee.push(i); hit = true; }
    if (/esquive|parade|defense|bouclier|initiative|\bsurprise?\b/.test(txt)) { g.defense.push(i); hit = true; }
    if (!hit && /combat|degat|attaque|avantage|frenesie|critique/.test(all)) g.general.push(i);
  });
  return g;
}

function talentTags(c, idx) {
  if (!idx.length) return '';
  return `<div class="tal-tags">${idx.map((i) => {
    const t = c.talents[i];
    return `<span class="tal-tag" data-act="talInfo" data-i="${i}" role="button">★ ${esc(t.name)}${+t.times > 1 ? ` ${t.times}` : ''}</span>`;
  }).join('')}</div>`;
}

// Pastilles vertes (atouts) et rouges (défauts) d'une arme
function qualityTags(w, list) {
  const { known, other } = R.parseQualities(w.qualities, list);
  if (!known.length && !other.length) return '';
  const kind = list === R.ARMOUR_QUALITIES ? 'a' : 'w';
  return `<div class="q-tags">${known.map(({ q, rating }) => `<span class="q-tag ${q.kind === 'atout' ? 'pro' : 'con'}" data-act="qInfo" data-q="${esc(q.name)}" data-l="${kind}" role="button">${esc(q.name)}${rating ? ` ${rating}` : ''}</span>`).join('')}${other.map((o) => `<span class="q-tag">${esc(o)}</span>`).join('')}</div>`;
}

const stepper = (path, val) => `<span class="step"><button data-act="step" data-p="${path}" data-d="-1">−</button><span class="val">${+val || 0}</span><button data-act="step" data-p="${path}" data-d="1">+</button></span>`;

// ---------- Équipement ----------
function viewSac(c) {
  const enc = R.encumbrance(c);
  const ratio = enc.max ? enc.total / enc.max : 0;
  const weapons = c.weapons.map((w, i) => {
    const d = R.weaponDamage(c, w);
    return `<div class="list-item weapon" data-act="editWeapon" data-i="${i}" role="button"><span class="li-main">
      <div class="li-title">${esc(w.name)}<span class="dmg">${d != null ? `${d} <small class="muted">(${esc(w.damage)})</small>` : esc(w.damage)}</span></div>
      <div class="li-sub">${[w.group, w.reach, w.qualities].filter(Boolean).map(esc).join(' · ')}${w.enc ? ` · Enc ${w.enc}` : ''}</div>
    </span></div>`;
  }).join('') || '<div class="empty">Aucune arme.</div>';
  const armour = c.armour.map((a, i) => `<div class="list-item"><button class="equip-toggle ${a.equipped ? 'on' : ''}" data-act="toggleEquip" data-i="${i}" aria-label="Portée"></button>
    <span class="li-main" data-act="editArmour" data-i="${i}" role="button"><div class="li-title">${esc(a.name)} <span class="badge soft">${a.ap || 0} PA</span></div>
    <div class="li-sub">${(a.locations || []).map((k) => R.LOCATIONS.find((l) => l.key === k)?.name).filter(Boolean).join(', ') || 'Aucune localisation'}${a.enc ? ` · Enc ${a.enc}` : ''}</div>${qualityTags(a, R.ARMOUR_QUALITIES)}</span></div>`).join('') || '<div class="empty">Aucune armure.</div>';
  const items = c.items.map((it, i) => `<div class="list-item"><span class="li-main" data-act="editItem" data-i="${i}" role="button"><div class="li-title">${esc(it.name)}</div><div class="li-sub">${it.enc ? `Enc ${it.enc}` : ''}${it.notes ? ` ${esc(it.notes)}` : ''}</div></span>
    <span class="qty"><button data-act="qty" data-i="${i}" data-d="-1">−</button><span>${it.qty ?? 1}</span><button data-act="qty" data-i="${i}" data-d="1">+</button></span></div>`).join('') || '<div class="empty">Le sac est vide.</div>';

  return `<div class="grid two">
    <div class="stack">
      <section class="card">
        <h2>Encombrement</h2>
        <div class="row between"><b style="font-family:var(--font-title);font-size:22px">${enc.total} / ${enc.max}</b><span class="small muted">Max = BF + BE${c.encExtra ? ` + ${c.encExtra}` : ''}</span></div>
        <div class="bar enc ${ratio > 1 ? 'over' : ratio > .8 ? 'warn' : ''}"><i style="width:${Math.min(100, ratio * 100)}%"></i></div>
        <div class="stats-row" style="grid-template-columns:repeat(3,1fr)">
          <div class="stat"><div class="sk">Armes</div><div class="sv">${enc.weapons}</div></div>
          <div class="stat"><div class="sk">Armure</div><div class="sv">${enc.armour}</div></div>
          <div class="stat"><div class="sk">Possessions</div><div class="sv">${enc.items}</div></div>
        </div>
        ${ratio > 1 ? '<p class="small" style="color:var(--blood);margin:10px 0 0"><b>Surchargé !</b> Mouvement et Agilité sont pénalisés.</p>' : ''}
      </section>
      <section class="card">
        <h2>Armes</h2>${weapons}
        <div class="add-row"><button class="btn ghost small" data-act="editWeapon" data-i="-1">${icon('plus')} Arme</button></div>
      </section>
      <section class="card">
        <h2>Armure</h2>${armour}
        <div class="add-row"><button class="btn ghost small" data-act="editArmour" data-i="-1">${icon('plus')} Pièce d'armure</button></div>
      </section>
    </div>
    <div class="stack">
      <section class="card">
        <h2>Richesses</h2>
        <div class="money">
          <div class="coin co"><div class="disc">CO</div>${bind('money.co', c.money.co, 'number')}<div class="small muted">Couronnes d'or</div></div>
          <div class="coin pa"><div class="disc">PA</div>${bind('money.pa', c.money.pa, 'number')}<div class="small muted">Pistoles d'argent</div></div>
          <div class="coin sc"><div class="disc">SC</div>${bind('money.sc', c.money.sc, 'number')}<div class="small muted">Sous de cuivre</div></div>
        </div>
        <div class="row" style="margin-top:12px"><button class="btn" style="flex:1" data-act="pay" data-mode="pay">Payer</button><button class="btn green" style="flex:1" data-act="pay" data-mode="gain">Recevoir</button></div>
        <p class="small muted" style="margin:8px 0 0">1 CO = 20 PA = 240 SC. La monnaie est rendue automatiquement.</p>
      </section>
      <section class="card">
        <h2>Possessions</h2>${items}
        <form class="add-row" data-form="quickItem"><input name="item" placeholder="Ajouter un objet (ex. Corde, 10 m)" style="flex:1"><button class="btn small" type="submit">${icon('plus')}</button></form>
      </section>
    </div>
  </div>`;
}

// ---------- Progression ----------
function viewProg(c) {
  const lvl = R.careerLevel(c);
  const L = c.career.levels[lvl - 1] || {};
  const p = R.careerProgress(c);
  const lastUndoable = c.xpLog.find((x) => !x.undone);
  const changeCost = R.careerChangeCost(p.complete);
  const hasCareer = !!c.career.name;

  const check = (ok, label) => `<div class="check ${ok ? 'done' : ''}"><span class="ok">${ok ? icon('check') : ''}</span><span>${label}</span></div>`;

  return `<div class="grid two">
    <div class="stack">
      <section class="card">
        <h2>Expérience</h2>
        <div class="xp-boxes">
          <div class="stat avail"><div class="sk">Actuelle</div><div class="sv">${avail(c)}</div></div>
          <div class="stat"><div class="sk">Dépensée</div><div class="sv">${c.xp.spent}</div></div>
          <div class="stat"><div class="sk">Totale</div><div class="sv">${c.xp.total}</div></div>
        </div>
        <div class="row" style="margin-top:12px">
          <button class="btn green" style="flex:1" data-act="gainXp">${icon('plus')} Gagner de l'XP</button>
          <button class="btn ${ui.levelUp ? 'ghost' : 'gold'}" style="flex:1" data-act="toggleLevelUp">${icon('star')} ${ui.levelUp ? 'Quitter la progression' : 'Mode progression'}</button>
        </div>
      </section>
      <section class="card">
        <h2>Carrière <button class="icon-btn h-act" data-act="editCareer" aria-label="Modifier">${icon('edit')}</button></h2>
        ${hasCareer ? `
          <div style="text-align:center">
            ${c.className ? `<span class="tag" style="font-family:var(--font-title);letter-spacing:.06em">${esc(c.className)}</span>` : ''}
            <div style="font-family:var(--font-title);font-weight:900;font-size:22px;color:var(--blood)">${esc(c.career.name)}</div>
            <div>${esc(L.title || '')} — <b>échelon ${lvl}</b>${L.status ? ` · Statut ${esc(L.status)}` : ''}</div>
            ${c.career.path ? `<div class="small muted">${esc(c.career.path)}</div>` : ''}
          </div>
          <h3>Pour terminer l'échelon ${lvl} (${p.need} augmentations)</h3>
          ${check(p.chars.length && p.charsOk.length === p.chars.length, `Caractéristiques de carrière : ${p.charsOk.length} / ${p.chars.length}${p.chars.length ? ` <span class="muted small">(${p.chars.join(', ')})</span>` : ''}`)}
          ${check(p.skillsOk.length >= p.skillsNeeded && p.skillsNeeded > 0, `Compétences de carrière : ${p.skillsOk.length} / ${p.skillsNeeded}`)}
          ${check(p.talentsOk.length >= p.talentsNeeded, `Talent de l'échelon : ${p.talentsOk.length ? esc(p.talentsOk.join(', ')) : `0 / ${p.talentsNeeded}`}`)}
          <div class="row" style="margin-top:12px">
            ${lvl < 4 ? `<button class="btn gold" style="flex:1" data-act="nextLevel" ${p.complete && avail(c) >= R.LEVEL_UP_COST ? '' : 'disabled'}>Échelon ${lvl + 1} (${R.LEVEL_UP_COST} XP)</button>` : ''}
            <button class="btn ghost" style="flex:1" data-act="changeCareer" ${avail(c) >= changeCost ? '' : 'disabled'}>Changer de carrière (${changeCost} XP)</button>
          </div>
          ${!p.complete ? `<p class="small muted" style="margin:8px 0 0">Changer de carrière avant d'avoir terminé l'échelon coûte ${R.careerChangeCost(false)} XP.</p>` : ''}
        ` : `<p class="empty">Aucune carrière renseignée.</p><button class="btn block" data-act="editCareer">Renseigner ma carrière</button>
             <p class="small muted">Saisis le schéma de carrière de ton livre de règles : l'appli saura alors ce qui est « dans ta carrière » (coût normal) ou « hors carrière » (coût ×2).</p>`}
        ${c.careerHistory.length ? `<h3>Carrières précédentes</h3>${c.careerHistory.map((h) => `<div class="small">• ${esc(h.name)} — ${esc(h.title || '')} (échelon ${h.level})</div>`).join('')}` : ''}
      </section>
      <section class="card">
        <h2>Coûts en XP</h2>
        <table class="small" style="width:100%;border-collapse:collapse;text-align:center">
          <tr class="muted"><th style="text-align:left">Augmentations</th><th>Caract.</th><th>Comp.</th></tr>
          ${[0, 5, 10, 15, 20, 25, 30].map((n) => `<tr style="border-top:1px dashed var(--line)"><td style="text-align:left">${n + 1} à ${n + 5}</td><td>${R.advanceCost('char', n)}</td><td>${R.advanceCost('skill', n)}</td></tr>`).join('')}
        </table>
        <p class="small muted" style="margin:8px 0 0">Talent : 100 XP × nombre de fois déjà pris + 1. Hors carrière : coût doublé.</p>
      </section>
    </div>
    <section class="card">
      <h2>Historique de l'XP</h2>
      ${c.xpLog.map((e) => `<div class="hist ${e.undone ? 'undone' : ''}">
        <span class="hd">${fmtDate(e.date)}</span><span class="hl">${esc(e.label)}</span>
        <span class="ha ${e.kind}">${e.kind === 'gain' ? '+' : '−'}${e.amount}</span>
        ${e === lastUndoable ? `<button class="icon-btn" data-act="undo" title="Annuler" aria-label="Annuler">${icon('undo')}</button>` : ''}
      </div>`).join('') || '<div class="empty">Rien pour l\'instant. Gagne de l\'XP et dépense-le en mode progression !</div>'}
    </section>
  </div>`;
}

// Noms de compétences employés dans les « tests associés » des talents → nom de la feuille
const SKILL_SYNONYMS = {
  melee: 'corps a corps', connaissance: 'savoir', connaissances: 'savoir', equitation: 'chevaucher',
  canalisation: 'focalisation', commerages: 'ragot', soins: 'guerison', tir: 'projectiles', escalader: 'escalade',
  divertir: 'divertissement', jeu: 'pari', jeux: 'pari', jouer: 'pari', evaluer: 'evaluation',
  interpretation: 'representation', conduite: "conduite d'attelage", canotage: 'ramer', nager: 'natation',
  consommation: "resistance a l'alcool",
};
const baseOf = (s) => R.norm(String(s).replace(/\s*\(.*$/, ''));

// Pour chaque compétence du personnage, la liste des talents qu'il possède et qui la concernent
function skillTalentHints(c) {
  const bases = c.skills.map((s) => ({ s, base: baseOf(s.name) }));
  const out = new Map();
  for (const t of c.talents) {
    const info = store.findTalent(t.name);
    if (!info?.tests || +t.times <= 0) continue;
    for (const raw of info.tests.split(/[,/;]|\bou\b|\bet\b/)) {
      let part = R.norm(raw.replace(/\(.*?\)/g, ''));
      const first = part.split(' ')[0];
      if (SKILL_SYNONYMS[first]) part = SKILL_SYNONYMS[first] + part.slice(first.length);
      if (!part) continue;
      // La compétence au nom le plus long qui correspond gagne (« Résistance à l'alcool » plutôt que « Résistance »)
      const hits = bases.filter(({ base }) => part === base || part.startsWith(base + ' '));
      const best = Math.max(0, ...hits.map((h) => h.base.length));
      for (const { s, base } of hits) {
        if (base.length !== best) continue;
        const list = out.get(s.id) || [];
        if (!list.some((x) => x.name === t.name)) list.push({ name: t.name, times: +t.times || 1, desc: info.desc });
        out.set(s.id, list);
      }
    }
  }
  return out;
}

// « Bonus de FM » → « BFM », « 2 » → « 2 »
const maxShort = (m) => {
  const k = String(m || '').match(/bonus\s+de\s+([A-Za-z]+)/i);
  return k ? `B${k[1].replace(/^DXT$/i, 'Dex')}` : (m || '—');
};

function libraryList() {
  const all = store.careers();
  if (!all.length) return '<div class="empty">Aucun schéma pour l\'instant.</div>';
  const groups = {};
  for (const t of all) (groups[t.className || 'Autres'] ||= []).push(t);
  return Object.keys(groups).sort((a, b) => a.localeCompare(b, 'fr')).map((g) => `<h3>${esc(g)}</h3>${groups[g].map((t) => `
    <div class="list-item" data-act="openCareerTemplate" data-id="${esc(t.id)}" role="button">
      <span class="li-main"><div class="li-title">${esc(t.name)}</div>
      <div class="li-sub">${t.levels.map((l) => l.title).filter(Boolean).map(esc).join(' → ') || 'Titres non renseignés'}</div></span>
      <span class="badge ${store.canEditCareer(t) ? 'gold' : 'soft'}" title="${store.canEditCareer(t) ? 'À toi' : esc(t.authorName || '')}">${store.canEditCareer(t) ? '★' : esc((t.authorName || '?').charAt(0).toUpperCase())}</span>
    </div>`).join('')}`).join('');
}

// ---------- Carnet ----------
function viewCarnet(c) {
  const sp = Object.keys(R.SPECIES);
  return `<div class="grid two">
    <div class="stack">
      <section class="card">
        <h2>Identité</h2>
        <div class="fields">
          <div class="field full"><label>Nom</label>${bind('name', c.name, 'text', 'data-rerender')}</div>
          <div class="field"><label>Race</label><select data-bind="species" data-rerender>${sp.map((s) => `<option ${s === c.species ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
          <div class="field"><label>Carrière</label>${careerSelect(c.career.name, 'carnetCareer')}</div>
          <div class="field"><label>Classe</label><div class="cls-auto">${esc(c.className || '—')}</div></div>
          <div class="field"><label>Âge</label>${bind('age', c.age)}</div>
          <div class="field"><label>Taille</label>${bind('height', c.height)}</div>
          <div class="field"><label>Cheveux</label>${bind('hair', c.hair)}</div>
          <div class="field"><label>Yeux</label>${bind('eyes', c.eyes)}</div>
        </div>
      </section>
      <section class="card">
        <h2>Destin & Résilience</h2>
        <div class="fields">
          <div class="field"><label>Destin</label>${bind('fate.fate', c.fate.fate, 'number', `min="0" data-full="${(+c.fate.fortune || 0) >= R.maxFortune(c) ? 1 : 0}"`)}</div>
          <div class="field"><label>Résilience</label>${bind('fate.resilience', c.fate.resilience, 'number', `min="0" data-full="${(+c.fate.resolve || 0) >= R.maxResolve(c) ? 1 : 0}"`)}</div>
          <div class="field full"><label>Motivation</label>${bind('fate.motivation', c.fate.motivation, 'text', 'placeholder="ex. Venger ma famille"')}</div>
        </div>
        <p class="small muted" style="margin:0">Maximum de Chance : <b>${R.maxFortune(c)}</b>${R.luckBonus(c) ? ' (talent Chance compris)' : ''} · Maximum de Détermination : <b>${R.maxResolve(c)}</b>${R.strongMindBonus(c) ? " (talent Fort d'Esprit compris)" : ''}.
          Les points se dépensent dans l'onglet <b>Combat</b> ; « Nouvelle séance » y remet la Chance au maximum.</p>
      </section>
      <section class="card">
        <h2>Ambitions</h2>
        <div class="field"><label>À court terme</label>${bind('ambitions.short', c.ambitions.short, 'area')}</div>
        <div class="field"><label>À long terme</label>${bind('ambitions.long', c.ambitions.long, 'area')}</div>
      </section>
      <section class="card">
        <h2>Groupe</h2>
        <div class="field"><label>Nom du groupe</label>${bind('party.name', c.party.name)}</div>
        <div class="field"><label>À court terme</label>${bind('party.short', c.party.short)}</div>
        <div class="field"><label>À long terme</label>${bind('party.long', c.party.long)}</div>
        <div class="field"><label>Membres</label>${bind('party.members', c.party.members, 'area')}</div>
      </section>
    </div>
    <div class="stack">
      <section class="card">
        <h2>Magie</h2>
        <div class="field"><label>Onglet Magie</label>
          <select data-bind="magicTab" data-rerender>
            <option value="" ${!c.magicTab ? 'selected' : ''}>Automatique (${R.isCaster({ ...c, magicTab: '' }) ? 'affiché' : 'masqué'})</option>
            <option value="on" ${c.magicTab === 'on' ? 'selected' : ''}>Toujours afficher</option>
            <option value="off" ${c.magicTab === 'off' ? 'selected' : ''}>Masquer</option>
          </select></div>
        <p class="small muted" style="margin:0">L'onglet apparaît tout seul si ton personnage a un talent de magie ou de foi (Magie des Arcanes, Magie Mineure, Béni, Invoquer…), des sorts, ou la compétence Langue (Magick), Focalisation ou Prière.${R.isCaster(c) ? ' <a href="#" data-act="tab" data-tab="magie">Ouvrir l’onglet Magie</a>' : ''}</p>
      </section>
      <section class="card">
        <h2>Psychologie</h2>${bind('psychology', c.psychology, 'area')}
      </section>
      <section class="card">
        <h2>Corruption</h2>
        <div class="counter"><span class="ck">Points de corruption <span class="small muted" style="text-transform:none;letter-spacing:0">(seuil ${R.corruptionMax(c)} = BE + BFM)</span></span>${stepper('corruption', c.corruption)}</div>
        ${(+c.corruption || 0) > R.corruptionMax(c) ? '<div class="cost-line bad">☠ Seuil dépassé : <b>test de mutation</b> (voir le livre de règles).</div>' : ''}
        <div class="counter"><span class="ck">Péché</span>${stepper('sin', c.sin)}</div>
        <h3>Mutations</h3>${bind('mutations', c.mutations, 'area')}
      </section>
      <section class="card">
        <h2>Notes</h2>${bind('notes', c.notes, 'area', 'style="min-height:180px"')}
      </section>
    </div>
  </div>`;
}

// ---------- Bibliothèque : carrières, talents, sorts ----------
function spellMeta(c, s) {
  const calc = (txt) => {
    const v = R.spellValue(c, txt);
    return v != null ? `${txt} (= ${v})` : txt;
  };
  return [s.range && `Portée ${calc(s.range)}`, s.target && `Cible ${calc(s.target)}`, s.duration && `Durée ${calc(s.duration)}`].filter(Boolean);
}

function viewBiblio(c) {
  const tab = ui.libTab || 'careers';
  const counts = { careers: store.careers().length, talents: store.talents().length, spells: store.spells().length };
  const searchRow = (t) => `data-search="${esc(R.norm(t))}"`;
  let list = '';
  if (tab === 'careers') {
    list = libraryList();
  } else if (tab === 'talents') {
    list = store.talents().map((t) => `<div class="list-item" data-act="openTalentInfo" data-id="${esc(t.id)}" ${searchRow([t.name, ...(t.aliases || []), t.desc, t.tests].join(' '))} role="button">
      <span class="li-main"><div class="li-title">${esc(t.name)}${c.talents.some((x) => store.findTalent(x.name)?.id === t.id) ? ' <span class="tal">✓</span>' : ''}</div><div class="li-sub">${esc(t.desc || '')}</div></span>
      <span class="badge soft" title="Maximum">${esc(maxShort(t.max))}</span></div>`).join('') || '<div class="empty">Aucun talent. Importe un fichier de talents via Menu ⋮ > Importer.</div>';
  } else {
    const groups = {};
    for (const s of store.spells()) (groups[s.lore || 'Autres'] ||= []).push(s);
    const order = (g) => (g === 'Sort Mineur' ? '0' : g === 'Sort des Arcanes' ? '1' : '2' + g);
    list = Object.keys(groups).sort((a, b) => order(a).localeCompare(order(b), 'fr')).map((g) => `<div class="lib-group" data-group><h3>${esc(g)}</h3>${groups[g].map((s) => `
      <div class="list-item" data-act="openSpellInfo" data-id="${esc(s.id)}" ${searchRow([s.name, s.lore, s.desc].join(' '))} role="button">
        <span class="badge" title="NI">${esc(s.cn || '–')}</span>
        <span class="li-main"><div class="li-title">${esc(s.name)}${c.spells.some((x) => R.norm(x.name) === R.norm(s.name)) ? ' <span class="tal">✓</span>' : ''}</div><div class="li-sub">${esc(s.desc || '')}</div></span>
      </div>`).join('')}</div>`).join('') || '<div class="empty">Aucun sort. Importe un fichier de sorts via Menu ⋮ > Importer.</div>';
  }
  const labels = { careers: 'Carrières', talents: 'Talents', spells: 'Sorts' };
  return `<section class="card">
    <h2>Bibliothèque</h2>
    <div class="level-tabs">${Object.keys(labels).map((k) => `<button class="chip ${tab === k ? 'on' : ''}" data-act="libTab" data-t="${k}">${labels[k]} <small>${counts[k]}</small></button>`).join('')}</div>
    ${tab !== 'careers' ? `<input type="search" id="libSearch" placeholder="Rechercher…" style="margin-bottom:8px" value="${esc(ui.libSearch || '')}">` : ''}
    <div id="libList">${list}</div>
    <p class="small muted" style="margin:10px 0 0">Partagée avec tes camarades. ✓ = déjà sur la fiche de ${esc(c.name)}.${store.userUid ? '' : ' <b>Connecte-toi (nuage) pour voir les ajouts des autres.</b>'} Pour en ajouter : Menu ⋮ > Importer.</p>
  </section>`;
}

function filterLib(q) {
  const n = R.norm(q);
  document.querySelectorAll('#libList [data-search]').forEach((row) => { row.hidden = !!n && !row.dataset.search.includes(n); });
  document.querySelectorAll('#libList [data-group]').forEach((g) => { g.hidden = !g.querySelector('[data-search]:not([hidden])'); });
}

// ---------- Magie : sorts et prières (lanceurs de sorts et prêtres seulement) ----------
const isPrayer = (sp) => /benediction|miracle|priere|divin|\bculte\b/.test(R.norm(`${sp.lore || ''} ${sp.name || ''}`));

function viewMagie(c) {
  const ms = R.magicSkills(c);
  const focus = +c.magicFocus || 0;
  const priest = !!ms.pray || c.talents.some((t) => /\bbeni\b|invoquer|bless|invoke/.test(R.norm(t.name)));
  const stat = (label, val, act, extra = '') => `<div class="stat ${act ? 'roll' : ''}" ${act || ''}><div class="sk">${label}</div><div class="sv">${val}</div>${extra}</div>`;
  const skillStat = (label, sk) => sk
    ? stat(label, R.skillValue(c, sk), `data-act="rollSkill" data-id="${sk.id}" role="button"`)
    : stat(label, '—', '', '<div class="def-bonus">à ajouter</div>');
  const spells = c.spells.map((sp, i) => {
    const prayer = isPrayer(sp);
    const cn = +sp.cn || 0;
    const left = Math.max(0, cn - focus);
    return `<div class="spell-card ${prayer ? 'prayer' : ''}">
      <div class="spell-head">
        <span class="badge" title="NI">${esc(sp.cn !== '' && sp.cn != null ? sp.cn : '–')}</span>
        <div class="spell-name" data-act="editSpell" data-i="${i}" role="button"><b>${esc(sp.name)}</b>${sp.lore ? `<div class="small muted">${esc(sp.lore)}</div>` : ''}</div>
        <button class="btn small ${prayer ? 'gold' : ''}" data-act="castSpell" data-i="${i}">${icon(prayer ? 'star' : 'wand')} ${prayer ? 'Prier' : 'Lancer'}</button>
      </div>
      <div class="spell-meta">${spellMeta(c, sp).map(esc).join(' · ')}${!prayer && cn ? ` · <b>${focus ? `NI restant ${left}` : `NI ${cn}`}</b>` : ''}</div>
      ${sp.effect ? `<div class="spell-eff">${esc(sp.effect)}</div>` : ''}
    </div>`;
  }).join('') || '<div class="empty">Aucun sort ni prière. Ajoute-les depuis la bibliothèque ou à la main.</div>';

  return `<div class="grid two">
    <div class="stack">
      <section class="card">
        <h2>Pouvoirs</h2>
        <div class="stats-row">
          ${skillStat('Langue (Magick)', ms.cast)}
          ${skillStat('Focalisation', ms.channel)}
          ${stat('FM / BFM', `${R.charValue(c, 'FM')}<small style="font-size:14px"> / ${R.charBonus(c, 'FM')}</small>`)}
        </div>
        ${priest ? `<div class="stats-row" style="margin-top:8px">
          ${skillStat('Prière', ms.pray)}
          <div class="stat"><div class="sk">Péché</div><div class="sv">${stepper('sin', c.sin)}</div></div>
          ${stat('Corruption', `${+c.corruption || 0}<small style="font-size:14px"> / ${R.corruptionMax(c)}</small>`)}
        </div>` : ''}
        <p class="small muted" style="margin:10px 0 0">Touche une compétence pour faire un test. Il en manque une ? Ajoute-la dans l'onglet Fiche (compétence groupée ou avancée).</p>
      </section>
      <section class="card">
        <h2>Focalisation</h2>
        <div class="row between">
          <button class="btn" style="width:52px;font-size:22px" data-act="focusStep" data-d="-1">−</button>
          <div style="text-align:center"><div class="adv-val">${focus}</div><div class="small muted">DR accumulés</div></div>
          <button class="btn green" style="width:52px;font-size:22px" data-act="focusStep" data-d="1">+</button>
        </div>
        <div class="row" style="margin-top:10px">
          <button class="btn gold" style="flex:1" data-act="channel" ${ms.channel ? '' : 'disabled'}>${icon('die')} Focaliser</button>
          <button class="btn ghost" style="flex:1" data-act="focusStep" data-d="reset">Remettre à 0</button>
        </div>
        <p class="small muted" style="margin:8px 0 0">Chaque DR accumulé réduit d'autant le NI du prochain sort. Le compteur repart à 0 quand le sort est lancé.</p>
      </section>
    </div>
    <section class="card">
      <h2>Sorts et prières</h2>
      ${spells}
      <div class="add-row"><button class="btn ghost small" data-act="editSpell" data-i="-1">${icon('plus')} Sort / prière</button>${store.spells().length ? `<button class="btn ghost small" data-act="openSpellLib">${icon('library')} Parcourir la bibliothèque</button>` : ''}</div>
    </section>
  </div>`;
}

const VIEWS = { fiche: viewFiche, sante: viewSante, sac: viewSac, prog: viewProg, carnet: viewCarnet, magie: viewMagie, biblio: viewBiblio };

// ================= Actions =================
const A = {
  tab(el) { ui.tab = el.dataset.tab; localStorage.setItem('whfrp4.tab', ui.tab); window.scrollTo(0, 0); render(); },
  toggleLevelUp() { ui.levelUp = !ui.levelUp; if (ui.levelUp && ui.tab !== 'fiche' && ui.tab !== 'prog') ui.tab = 'fiche'; render(); },
  skillFilter(el) { ui.skillFilter = el.dataset.f; localStorage.setItem('whfrp4.skillFilter', ui.skillFilter); render(); },
  noop() {},

  // --- Achats ---
  buyChar(el) {
    const c = C(); const k = el.dataset.k; const ch = c.chars[k];
    const inC = R.charInCareer(c, k);
    const cost = R.advanceCost('char', +ch.advances || 0, inC);
    if (spend(c, cost, `${k} +1 (→ ${R.charValue(c, k) + 1})${inC ? '' : ' hors carrière'}`, { type: 'char', key: k })) {
      ch.advances = (+ch.advances || 0) + 1; commit();
    }
  },
  buySkill(el) {
    const c = C(); const s = c.skills.find((x) => x.id === el.dataset.id);
    const inC = R.skillInCareer(c, s);
    const cost = R.advanceCost('skill', +s.advances || 0, inC);
    if (spend(c, cost, `${R.skillLabel(s)} +1 (→ ${R.skillValue(c, s) + 1})${inC ? '' : ' hors carrière'}`, { type: 'skill', id: s.id })) {
      s.advances = (+s.advances || 0) + 1; commit();
    }
  },
  buyTalent(el) {
    const c = C(); const t = c.talents[+el.dataset.i];
    const max = R.talentMax(c, store.findTalent(t.name)?.max);
    if (max != null && (+t.times || 0) >= max) { toast(`Maximum atteint pour ${t.name} (${max})`); return; }
    const inC = R.talentInCareer(c, t.name);
    const cost = R.talentCost(+t.times || 0, inC);
    if (spend(c, cost, `Talent ${t.name} (${(+t.times || 0) + 1}e fois)${inC ? '' : ' hors carrière'}`, { type: 'talent', name: t.name })) {
      t.times = (+t.times || 0) + 1; commit();
    }
  },
  undo() { undoLast(C()); },
  gainXp() {
    openDialog({
      title: 'Gagner de l\'expérience',
      body: `${F.num('amount', 'Points d\'expérience', '', '', 'required min="1" autofocus')}${F.text('label', 'Raison (facultatif)', '', '', 'placeholder="ex. Séance du 12 novembre"')}`,
      actions: [cancel, { label: 'Ajouter', cls: 'green', primary: true, onClick: (f) => {
        const n = Math.round(num(f.amount.value));
        if (n <= 0) { toast('Indique un nombre positif'); return false; }
        gainXp(C(), n, f.label.value.trim()); commit(); toast(`+${n} XP`);
      } }],
    });
  },

  // --- Caractéristiques / compétences ---
  editChar(el) {
    const c = C(); const k = el.dataset.k; const ch = c.chars[k];
    openDialog({
      title: `${k} — ${R.CHARS.find((x) => x.key === k).name}`,
      body: `<div class="fields">${F.num('initial', 'Initiale', ch.initial)}${F.num('advances', 'Augmentations', ch.advances)}${F.num('modifier', 'Modificateur temporaire', ch.modifier || 0, 'full')}</div>
        ${(() => {
          const tb = R.talentCharBonus(c, k);
          if (!tb.value) return '';
          const twice = (+ch.modifier || 0) >= tb.value;
          return `<div class="cost-line ${twice ? 'bad' : ''}">★ <b>+${tb.value}</b> de talent (${esc(tb.names.join(', '))}), ajouté automatiquement.${twice ? '<br>Si ton modificateur correspond à ce même talent, remets-le à 0 : sinon le bonus est compté deux fois.' : ''}</div>`;
        })()}
        <p class="small muted">Modification libre, sans dépense d'XP (création, correction). Pour dépenser de l'XP, utilise le mode progression.</p>`,
      actions: [cancel, { label: 'Enregistrer', primary: true, onClick: (f) => {
        ch.initial = num(f.initial.value); ch.advances = Math.max(0, num(f.advances.value)); ch.modifier = num(f.modifier.value); commit();
      } }],
    });
  },
  editSkill(el) {
    const c = C(); const s = c.skills.find((x) => x.id === el.dataset.id);
    openDialog({
      title: R.skillLabel(s),
      body: `<div class="fields">
        ${s.basic ? '' : F.text('name', 'Compétence', s.name, 'full')}
        ${F.text('spec', 'Spécialisation', s.spec, '', 'placeholder="ex. Escrime"')}
        ${F.select('char', 'Caractéristique', s.char, charOpts)}
        ${F.num('advances', 'Augmentations', s.advances, 'full')}
      </div><p class="small muted">Valeur : ${R.skillValue(c, s)} = ${s.char} ${R.charValue(c, s.char)} + ${s.advances || 0}. ${R.skillInCareer(c, s) ? '◆ Compétence de carrière.' : ''}</p>
      ${(skillTalentHints(c).get(s.id) || []).map((h) => `<div class="cost-line">★ <b>${esc(h.name)}</b>${h.times > 1 ? ` (niveau ${h.times})` : ''} — ${esc(h.desc || 'bonus lors des tests')}</div>`).join('')}`,
      actions: [
        ...(s.basic ? [] : [{ label: icon('trash'), cls: 'ghost', onClick: () => { c.skills = c.skills.filter((x) => x !== s); commit(); } }, 'spacer']),
        cancel,
        { label: 'Enregistrer', primary: true, onClick: (f) => {
          if (!s.basic) s.name = f.name.value.trim() || s.name;
          s.spec = f.spec.value.trim(); s.char = f.char.value; s.advances = Math.max(0, num(f.advances.value)); commit();
        } },
      ],
    });
  },
  addSkill() {
    openDialog({
      title: 'Nouvelle compétence',
      body: `<div class="fields">
        ${F.select('pick', 'Compétence', R.OTHER_SKILLS[0][0], [...R.OTHER_SKILLS.map(([n]) => n), ['__other', 'Autre…']], 'full')}
        <div class="field full" id="otherName" hidden><label>Nom</label><input name="name"></div>
        ${F.text('spec', 'Spécialisation', '', '', 'placeholder="ex. Arc, Reikspiel…"')}
        ${F.select('char', 'Caractéristique', R.OTHER_SKILLS[0][1], charOpts)}
      </div><p class="small muted">La compétence est ajoutée avec 0 augmentation. ${ui.levelUp ? 'Utilise ensuite le bouton + pour l\'acheter.' : ''}</p>`,
      onOpen: (f) => {
        f.pick.onchange = () => {
          const o = R.OTHER_SKILLS.find(([n]) => n === f.pick.value);
          f.querySelector('#otherName').hidden = !!o;
          if (o) f.char.value = o[1];
        };
      },
      actions: [cancel, { label: 'Ajouter', primary: true, onClick: (f) => {
        const name = f.pick.value === '__other' ? f.name.value.trim() : f.pick.value;
        if (!name) { toast('Donne un nom à la compétence'); return false; }
        const c = C();
        c.skills.push({ id: R.uid(), name, spec: f.spec.value.trim(), char: f.char.value, advances: 0, basic: false });
        commit(); toast(`${name} ajoutée`);
      } }],
    });
  },

  // --- Talents ---
  addTalent() { A.editTalent({ dataset: { i: '-1' } }); },
  editTalent(el) {
    const c = C(); const i = +el.dataset.i; const t = c.talents[i];
    const buying = !t && ui.levelUp;
    const costFor = (name) => R.talentCost(0, R.talentInCareer(c, name));
    openDialog({
      title: t ? t.name : (buying ? 'Acheter un talent' : 'Nouveau talent'),
      body: `${F.text('name', 'Nom', t?.name || '', '', 'autofocus list="talentNames" autocomplete="off"')}
        <datalist id="talentNames">${[...new Set([
          ...c.career.levels.slice(0, R.careerLevel(c)).flatMap((l) => l.talents),
          ...store.talents().map((x) => x.name),
        ])].map((n) => `<option value="${esc(n)}">`).join('')}</datalist>
        <div id="talentInfo"></div>
        ${buying ? '<div class="cost-line" id="cost"></div>' : F.num('times', 'Nombre de fois pris', t?.times ?? 1)}
        ${F.area('desc', 'Description', t?.desc || '', '')}`,
      onOpen: (f) => {
        let autoDesc = '';
        const upd = () => {
          const name = f.name.value.trim();
          const info = store.findTalent(name);
          const max = R.talentMax(c, info?.max);
          const have = c.talents.find((x) => R.norm(x.name) === R.norm(name));
          f.querySelector('#talentInfo').innerHTML = info
            ? `<p class="small" style="margin:0 0 10px">📚 <b>Max :</b> ${esc(info.max || '—')}${max != null ? ` (= ${max} pour toi)` : ''} · <b>Tests :</b> ${esc(info.tests || '—')}${info.sl ? ' · +1 DR' : ''}</p>`
            : '';
          // Remplit la description depuis la bibliothèque si l'utilisateur ne l'a pas écrite lui-même
          if (info?.desc && (!f.desc.value.trim() || f.desc.value === autoDesc)) { f.desc.value = info.desc; autoDesc = info.desc; }
          if (!buying) return;
          const inC = R.talentInCareer(c, name);
          const cost = R.talentCost(have ? +have.times : 0, inC);
          const atMax = max != null && have && +have.times >= max;
          const box = f.querySelector('#cost');
          box.className = `cost-line ${cost <= avail(c) && !atMax ? '' : 'bad'}`;
          box.innerHTML = atMax ? `Maximum atteint (${max})` : `Coût : <b>${cost} XP</b> ${inC ? '◆ talent de carrière' : '(hors carrière : coût doublé)'} — disponible : ${avail(c)} XP`;
        };
        f.name.oninput = upd; upd();
      },
      actions: [
        ...(t ? [{ label: icon('trash'), cls: 'ghost', onClick: () => { c.talents.splice(i, 1); commit(); } }, 'spacer'] : []),
        cancel,
        { label: buying ? 'Acheter' : 'Enregistrer', cls: buying ? 'gold' : '', primary: true, onClick: (f) => {
          let name = f.name.value.trim();
          if (!name) { toast('Donne un nom au talent'); return false; }
          // Reprend l'orthographe exacte de la bibliothèque (« tir précis » → « Tir Précis »)
          const libT = store.findTalent(name);
          if (libT && R.norm(name) === R.norm(libT.name)) name = libT.name;
          if (buying) {
            const existing = c.talents.find((x) => R.norm(x.name) === R.norm(name));
            const max = R.talentMax(c, store.findTalent(name)?.max);
            if (max != null && existing && +existing.times >= max) { toast(`Maximum atteint (${max})`); return false; }
            const inC = R.talentInCareer(c, name);
            const cost = R.talentCost(existing ? +existing.times : 0, inC);
            if (!spend(c, cost, `Talent ${name}${inC ? '' : ' hors carrière'}`, { type: 'talent', name })) return false;
            if (existing) existing.times++;
            else c.talents.push({ name, times: 1, desc: f.desc.value.trim() });
          } else if (t) {
            Object.assign(t, { name, times: Math.max(1, num(f.times.value)), desc: f.desc.value.trim() });
          } else {
            c.talents.push({ name, times: Math.max(1, num(f.times.value)), desc: f.desc.value.trim() });
          }
          commit();
        } },
      ],
    });
  },

  // --- Combat : jets de dés ---
  rollAttack(el) {
    const c = C(); const i = +el.dataset.i;
    const w = i >= 0 ? c.weapons[i] : { name: 'Mains nues', group: 'Bagarre', reach: 'Personnelle', damage: 'BF+0' };
    const ws = R.weaponSkill(c, w);
    openRoll({ title: `Attaque : ${w.name}`, label: ws.label, base: ws.value, combat: true, weapon: w });
  },
  rollParry() {
    const c = C();
    const best = c.weapons.filter((w) => !R.weaponSkill(c, w).ranged).map((w) => ({ w, s: R.weaponSkill(c, w) }))
      .sort((a, b) => b.s.value - a.s.value || R.hasQuality(b.w, 'parry+1') - R.hasQuality(a.w, 'parry+1'))[0];
    const s = best?.s || R.weaponSkill(c, { group: 'Base', reach: 'Moyenne' });
    openRoll({ title: `Parade${best ? ` : ${best.w.name}` : ''}`, label: s.label, base: s.value, combat: true, parryWeapon: best?.w || null });
  },
  rollSkill(el) {
    const c = C(); const s = c.skills.find((x) => x.id === el.dataset.id);
    if (!s) { toast('Compétence introuvable'); return; }
    openRoll({ title: R.skillLabel(s), label: `${R.skillLabel(s)} (${s.char})`, base: R.skillValue(c, s), combat: true });
  },
  rollChar(el) {
    const c = C(); const k = el.dataset.k;
    openRoll({ title: R.CHARS.find((x) => x.key === k).name, label: k, base: R.charValue(c, k), combat: k === 'I' });
  },
  rollFree() {
    const c = C();
    const opts = [...R.CHARS.map((x) => [`c:${x.key}`, `${x.key} — ${R.charValue(c, x.key)}`]),
      ...[...c.skills].sort((a, b) => R.skillLabel(a).localeCompare(R.skillLabel(b), 'fr')).map((s) => [`s:${s.id}`, `${R.skillLabel(s)} — ${R.skillValue(c, s)}`])];
    openDialog({
      title: 'Quel test ?',
      body: F.select('what', 'Caractéristique ou compétence', opts[0][0], opts),
      actions: [cancel, { label: 'Continuer', primary: true, onClick: (f) => {
        const [t, v] = f.what.value.split(':');
        setTimeout(() => (t === 'c' ? A.rollChar({ dataset: { k: v } }) : A.rollSkill({ dataset: { id: v } })), 50);
      } }],
    });
  },
  talInfo(el) {
    const c = C(); const t = c.talents[+el.dataset.i];
    if (!t) return;
    const info = store.findTalent(t.name);
    const max = R.talentMax(c, info?.max);
    showQualityPopover(el, {
      name: `${t.name}${+t.times > 1 || max != null ? ` (niveau ${t.times}${max != null ? `/${max}` : ''})` : ''}`,
      kind: 'talent', desc: [info?.desc || t.desc || 'Pas de description dans la bibliothèque.', info?.tests && info.tests !== '-' ? `Tests : ${info.tests}` : ''].filter(Boolean).join(' — '),
    });
  },
  focusStep(el) {
    const c = C();
    c.magicFocus = el.dataset.d === 'reset' ? 0 : Math.max(0, (+c.magicFocus || 0) + +el.dataset.d);
    commit();
  },
  channel() {
    const c = C(); const sk = R.magicSkills(c).channel;
    if (!sk) { toast('Ajoute la compétence Focalisation dans la Fiche'); return; }
    openRoll({ title: 'Focalisation', label: R.skillLabel(sk), base: R.skillValue(c, sk), channel: true });
  },
  castSpell(el) {
    const c = C(); const sp = c.spells[+el.dataset.i];
    if (!sp) return;
    const prayer = isPrayer(sp);
    const ms = R.magicSkills(c);
    const sk = prayer ? ms.pray : ms.cast;
    const key = prayer ? 'Soc' : 'Int';
    openRoll({
      title: `${prayer ? 'Prière' : 'Sort'} : ${sp.name}`,
      label: sk ? R.skillLabel(sk) : `${key} (sans ${prayer ? 'Prière' : 'Langue (Magick)'})`,
      base: sk ? R.skillValue(c, sk) : R.charValue(c, key),
      spell: { ...sp, prayer, cn: +sp.cn || 0 },
    });
  },
  openSpellLib() { ui.libTab = 'spells'; ui.libSearch = ''; A.tab({ dataset: { tab: 'biblio' } }); },
  qInfo(el) {
    const list = el.dataset.l === 'a' ? R.ARMOUR_QUALITIES : R.WEAPON_QUALITIES;
    const q = list.find((x) => x.name === el.dataset.q);
    if (q) showQualityPopover(el, q);
  },
  fortuneStep(el) {
    const c = C(); const max = R.maxFortune(c);
    const next = Math.max(0, Math.min(max, (+c.fate.fortune || 0) + +el.dataset.d));
    if (next === (+c.fate.fortune || 0)) { toast(+el.dataset.d < 0 ? 'Plus de points de Chance' : `Chance déjà au maximum (${max})`); return; }
    c.fate.fortune = next; commit();
  },
  fortuneSpend() {
    const c = C();
    if (!(+c.fate.fortune > 0)) { toast('Plus de points de Chance'); return; }
    c.fate.fortune--; commit(); toast('1 point de Chance dépensé');
  },

  // --- Santé ---
  wound(el) {
    const c = C(); const max = R.maxWounds(c);
    const cur = Math.min(c.health.wounds ?? max, max);
    c.health.wounds = Math.max(0, Math.min(max, cur + +el.dataset.d));
    if (c.health.wounds === 0 && +el.dataset.d < 0) toast('0 Blessure : chaque coup suivant inflige une blessure critique !');
    commit();
  },
  healFull() { const c = C(); c.health.wounds = R.maxWounds(c); commit(); toast('Blessures restaurées'); },
  damage() {
    const c = C(); const ap = R.armourPoints(c); const tb = R.charBonus(c, 'E');
    openDialog({
      title: 'Encaisser un coup',
      body: `${F.num('dmg', 'Dégâts de l\'attaque', '', '', 'autofocus required')}
        ${F.select('loc', 'Localisation', 'corps', R.LOCATIONS.map((l) => [l.key, `${l.name} (${l.range}) — ${ap[l.key]} PA`]))}
        <label class="row" style="margin:6px 0"><input type="checkbox" name="reduce" checked style="width:auto"> Soustraire BE (${tb}) + PA</label>
        <div class="cost-line" id="res"></div>`,
      onOpen: (f) => {
        const upd = () => {
          const d = num(f.dmg.value);
          const lost = f.reduce.checked ? Math.max(d > 0 ? 1 : 0, d - tb - ap[f.loc.value]) : d;
          f.querySelector('#res').innerHTML = `Blessures perdues : <b>${lost}</b>`;
        };
        f.dmg.oninput = upd; f.loc.onchange = upd; f.reduce.onchange = upd; upd();
      },
      actions: [cancel, { label: 'Appliquer', primary: true, onClick: (f) => {
        const d = num(f.dmg.value);
        const lost = f.reduce.checked ? Math.max(d > 0 ? 1 : 0, d - tb - ap[f.loc.value]) : d;
        const max = R.maxWounds(c);
        const cur = Math.min(c.health.wounds ?? max, max);
        c.health.wounds = Math.max(0, cur - lost);
        commit();
        toast(cur - lost < 0 ? 'Blessure critique ! (Blessures à 0)' : `−${lost} Blessures`);
      } }],
    });
  },
  woundsExtra() {
    const c = C();
    openDialog({
      title: 'Blessures supplémentaires',
      body: `${F.num('v', 'Bonus / malus aux Blessures max', c.health.woundsExtra || 0)}<p class="small muted">Pour les effets non calculés automatiquement. « Dur à cuire » est déjà compté s'il figure dans tes talents.</p>`,
      actions: [cancel, { label: 'Enregistrer', primary: true, onClick: (f) => { c.health.woundsExtra = num(f.v.value); commit(); } }],
    });
  },
  fortune(el) { const c = C(); const n = +el.dataset.n; c.fate.fortune = n < c.fate.fortune ? n : n + 1; commit(); },
  resolve(el) { const c = C(); const n = +el.dataset.n; c.fate.resolve = n < c.fate.resolve ? n : n + 1; commit(); },
  newSession() { const c = C(); c.fate.fortune = R.maxFortune(c); commit(); toast('Points de Chance restaurés'); },
  editFate() {
    const c = C(); const f0 = c.fate;
    openDialog({
      title: 'Destin & Résilience',
      body: `<div class="fields">${F.num('fate', 'Destin', f0.fate)}${F.num('fortune', 'Chance actuelle', f0.fortune)}${F.num('resilience', 'Résilience', f0.resilience)}${F.num('resolve', 'Détermination actuelle', f0.resolve)}${F.text('motivation', 'Motivation', f0.motivation, 'full')}</div>`,
      actions: [cancel, { label: 'Enregistrer', primary: true, onClick: (f) => {
        Object.assign(c.fate, { fate: num(f.fate.value), fortune: num(f.fortune.value), resilience: num(f.resilience.value), resolve: num(f.resolve.value), motivation: f.motivation.value.trim() });
        commit();
      } }],
    });
  },
  adv(el) {
    const c = C();
    if (el.dataset.d === 'reset') {
      c.health.advantage = 0;
      const hadInit = !!c.health.initRoll;
      delete c.health.initRoll;
      commit(); toast(hadInit ? 'Fin du combat : Avantage et initiative remis à 0' : 'Avantage remis à 0');
      return;
    }
    c.health.advantage = Math.max(0, (+c.health.advantage || 0) + +el.dataset.d); commit();
  },
  // Jet d'initiative : BI (+ Réflexes de Combat) + 1d10, gardé jusqu'à la fin du combat
  initiative() {
    const c = C(); const ib = R.initiativeBonus(c);
    const cur = c.health.initRoll;
    const save = (die) => {
      c.health.initRoll = { bi: ib.bi, reflexes: ib.reflexes, die, total: ib.total + die };
      commit(); toast(`Initiative : ${ib.total + die}`);
    };
    openDialog({
      title: 'Initiative',
      body: `<p style="margin-top:0">Score = <b>BI ${ib.bi}</b>${ib.reflexes ? ` + <b>${ib.reflexes}</b> (Réflexes de Combat)` : ''} + <b>1d10</b></p>
        ${cur ? `<div class="cost-line">Score actuel : <b>${cur.total}</b> (dé : ${cur.die}). Il reste affiché jusqu'à la fin du combat.</div>` : ''}
        <div class="row" style="margin-top:10px">
          <button type="button" class="btn gold" id="iRoll" style="flex:1">${icon('die')} Lancer 1d10</button>
          <input type="number" inputmode="numeric" name="die" min="1" max="10" placeholder="ou mon dé" style="width:110px">
          <button type="button" class="btn ghost" id="iManual">OK</button>
        </div>`,
      onOpen: (f) => {
        f.querySelector('#iRoll').onclick = () => { save(1 + Math.floor(Math.random() * 10)); dlg.close(); };
        f.querySelector('#iManual').onclick = () => {
          const d = num(f.die.value);
          if (d < 1 || d > 10) { toast('Entre un dé de 1 à 10'); return; }
          save(d); dlg.close();
        };
      },
      actions: [
        ...(cur ? [{ label: 'Effacer', cls: 'ghost', onClick: () => { delete c.health.initRoll; commit(); } }, 'spacer'] : []),
        { label: 'Fermer', cls: 'ghost' },
      ],
    });
  },
  cond(el) {
    const c = C(); const name = el.dataset.c; const def = R.CONDITIONS.find((x) => x.name === name);
    const n = +c.health.conditions[name] || 0;
    c.health.conditions[name] = def.stack ? n + 1 : 1; commit();
  },
  condMinus(el) {
    const c = C(); const name = el.dataset.c;
    const n = (+c.health.conditions[name] || 0) - 1;
    if (n <= 0) delete c.health.conditions[name]; else c.health.conditions[name] = n;
    commit();
  },
  addCrit() {
    openDialog({
      title: 'Blessure critique',
      body: `${F.text('name', 'Nom', '', '', 'autofocus placeholder="ex. Nez cassé"')}${F.select('location', 'Localisation', 'Corps', R.LOCATIONS.map((l) => l.name))}${F.area('desc', 'Effets', '', '')}`,
      actions: [cancel, { label: 'Ajouter', primary: true, onClick: (f) => {
        C().health.criticals.push({ name: f.name.value.trim() || 'Blessure critique', location: f.location.value, desc: f.desc.value.trim() }); commit();
      } }],
    });
  },
  healCrit(el) { const c = C(); confirmDialog('Blessure guérie ?', `Retirer « ${esc(c.health.criticals[+el.dataset.i].name)} » ?`, 'Guérie', () => { c.health.criticals.splice(+el.dataset.i, 1); commit(); }); },
  step(el) {
    const c = C(); const p = el.dataset.p; const d = +el.dataset.d;
    const before = +c[p] || 0;
    c[p] = Math.max(0, before + d); commit();
    if (p === 'corruption' && d > 0) corruptionScare(c);
    if (p === 'corruption' && d < 0 && before > 0) purifyEffect(c);
  },
  toggleScare() {
    const off = localStorage.getItem('whfrp4.scare') === 'off';
    localStorage.setItem('whfrp4.scare', off ? 'on' : 'off');
    toast(off ? 'Effet de corruption activé' : 'Effet de corruption désactivé');
  },

  // --- Équipement ---
  pay(el) {
    const gain = el.dataset.mode === 'gain';
    openDialog({
      title: gain ? 'Recevoir de l\'argent' : 'Payer',
      body: `<div class="fields four">${F.num('co', 'CO', '')}${F.num('pa', 'PA', '')}${F.num('sc', 'SC', '')}</div>`,
      actions: [cancel, { label: gain ? 'Recevoir' : 'Payer', cls: gain ? 'green' : '', primary: true, onClick: (f) => {
        const c = C(); const m = c.money;
        const amount = num(f.co.value) * 240 + num(f.pa.value) * 12 + num(f.sc.value);
        if (!amount) return;
        let total = num(m.co) * 240 + num(m.pa) * 12 + num(m.sc);
        if (gain) {
          m.co = num(m.co) + num(f.co.value); m.pa = num(m.pa) + num(f.pa.value); m.sc = num(m.sc) + num(f.sc.value);
        } else {
          if (amount > total) { toast('Pas assez d\'argent !'); return false; }
          total -= amount;
          m.co = Math.floor(total / 240); m.pa = Math.floor((total % 240) / 12); m.sc = total % 12;
        }
        commit();
      } }],
    });
  },
  editWeapon(el) {
    const c = C(); const i = +el.dataset.i;
    const w = c.weapons[i] || { name: '', group: '', enc: 1, reach: 'Moyenne', damage: 'BF+4', qualities: '' };
    const parsed = R.parseQualities(w.qualities);
    const chip = (q) => {
      const cur = parsed.known.find((k) => k.q === q);
      return `<label class="q-chip ${q.kind === 'atout' ? 'pro' : 'con'}" title="${esc(q.desc)}">
        <input type="checkbox" name="q" value="${esc(q.name)}" ${cur ? 'checked' : ''} hidden>${esc(q.name)}${q.auto ? ' ⚙' : ''}
        ${q.rated ? `<input type="number" inputmode="numeric" name="qr_${esc(q.name)}" value="${cur?.rating ?? ''}" placeholder="n" class="q-rate">` : ''}</label>`;
    };
    const combatSkills = c.skills.filter((sk) => /^(corps a corps|projectiles)/.test(R.norm(sk.name)))
      .sort((a, b) => R.skillLabel(a).localeCompare(R.skillLabel(b), 'fr'));
    const pros = R.WEAPON_QUALITIES.filter((q) => q.kind === 'atout');
    const cons = R.WEAPON_QUALITIES.filter((q) => q.kind === 'défaut');
    openDialog({
      title: i >= 0 ? w.name : 'Arme',
      body: `<div class="fields">${F.text('name', 'Nom', w.name, 'full', 'autofocus')}${F.text('group', 'Groupe', w.group, '', 'placeholder="Base, Escrime, Arc…"')}${F.num('enc', 'Enc', w.enc)}
        ${F.text('reach', 'Allonge / Portée', w.reach, '', 'placeholder="Moyenne, ou 50"')}${F.text('damage', 'Dégâts', w.damage, '', 'placeholder="BF+4"')}
        <div class="field full"><label>Compétence utilisée</label>
          <select name="skillId">
            <option value="">Automatique (d'après le groupe)</option>
            ${combatSkills.map((sk) => `<option value="${sk.id}" ${sk.id === w.skillId ? 'selected' : ''}>${esc(R.skillLabel(sk))} — ${R.skillValue(c, sk)}${sk.basic || +sk.advances > 0 ? '' : ' (non formé)'}</option>`).join('')}
            <option value="__new">Nouvelle spécialité…</option>
          </select>
          <div class="row" id="newSkill" hidden style="margin-top:6px">
            <select name="newKind" style="flex:1"><option value="Corps à corps">Corps à corps (CC)</option><option value="Projectiles">Projectiles (CT)</option></select>
            <input name="newSpec" placeholder="Spécialité, ex. Escrime, Arc" style="flex:1.4">
          </div>
          <div class="small muted" id="autoSkill" style="margin-top:4px"></div>
        </div></div>
        <div class="flabel">Atouts</div><div class="q-chips">${pros.map(chip).join('')}</div>
        <div class="flabel" style="margin-top:8px">Défauts</div><div class="q-chips">${cons.map(chip).join('')}</div>
        <div class="q-help">Touche une pastille pour la cocher et voir son effet.</div>
        ${F.text('other', 'Autres atouts / défauts', parsed.other.join(', '), 'full', 'placeholder="séparés par des virgules"')}
        <p class="small muted" style="margin:0">⚙ = effet appliqué automatiquement par le lanceur de dés. Les autres s'affichent en rappel.</p>`,
      onOpen: (f) => {
        wireQualityHelp(f, R.WEAPON_QUALITIES);
        const upd = () => {
          f.querySelector('#newSkill').hidden = f.skillId.value !== '__new';
          const auto = R.weaponSkill(c, { ...w, skillId: null, group: f.group.value, reach: f.reach.value });
          f.querySelector('#autoSkill').textContent = f.skillId.value ? '' : `Automatique : ${auto.label} (${auto.value})`;
        };
        f.skillId.addEventListener('change', upd); f.group.addEventListener('input', upd); f.reach.addEventListener('input', upd); upd();
      },
      actions: [
        ...(i >= 0 ? [{ label: icon('trash'), cls: 'ghost', onClick: () => { c.weapons.splice(i, 1); commit(); } }, 'spacer'] : []),
        cancel,
        { label: 'Enregistrer', primary: true, onClick: (f) => {
          const sel = [...f.querySelectorAll('[name=q]:checked')].map((x) => {
            const r = f.querySelector(`[name="qr_${x.value}"]`)?.value;
            return r ? `${x.value} ${r}` : x.value;
          });
          const other = f.other.value.split(',').map((x) => x.trim()).filter(Boolean);
          // Compétence : existante, nouvelle spécialité (créée à 0 augmentation), ou automatique
          let skillId = f.skillId.value || null;
          if (skillId === '__new') {
            const kind = f.newKind.value; const spec = f.newSpec.value.trim();
            if (!spec) { toast('Indique la spécialité (ex. Escrime)'); return false; }
            let sk = c.skills.find((x) => R.norm(x.name) === R.norm(kind) && R.norm(x.spec) === R.norm(spec));
            if (!sk) { sk = { id: R.uid(), name: kind, spec, char: kind === 'Projectiles' ? 'CT' : 'CC', advances: 0, basic: false }; c.skills.push(sk); toast(`Compétence ${kind} (${spec}) ajoutée à ta fiche`); }
            skillId = sk.id;
          }
          w.skillId = skillId;
          Object.assign(w, {
            name: f.name.value.trim() || 'Arme', group: f.group.value.trim(), enc: num(f.enc.value),
            reach: f.reach.value.trim(), damage: f.damage.value.trim(), qualities: [...sel, ...other].join(', '),
          });
          if (i < 0) c.weapons.push(w);
          commit();
        } },
      ],
    });
  },
  editArmour(el) {
    const c = C(); const i = +el.dataset.i; const a = c.armour[i] || { name: '', locations: [], enc: 1, ap: 1, qualities: '', equipped: true };
    const parsedA = R.parseQualities(a.qualities, R.ARMOUR_QUALITIES);
    openDialog({
      title: i >= 0 ? a.name : 'Pièce d\'armure',
      body: `<div class="fields">${F.text('name', 'Nom', a.name, 'full', 'autofocus')}${F.num('ap', 'PA', a.ap)}${F.num('enc', 'Enc', a.enc)}
        <div class="field full"><label>Localisations</label><div class="row">${R.LOCATIONS.map((l) => `<label class="chip"><input type="checkbox" name="loc" value="${l.key}" ${a.locations.includes(l.key) ? 'checked' : ''} hidden>${l.name}</label>`).join('')}</div></div>
        </div>
        <div class="flabel">Atouts et défauts</div>
        <div class="q-chips">${R.ARMOUR_QUALITIES.map((q) => `<label class="q-chip ${q.kind === 'atout' ? 'pro' : 'con'}" title="${esc(q.desc)}"><input type="checkbox" name="aq" value="${esc(q.name)}" ${parsedA.known.some((k) => k.q === q) ? 'checked' : ''} hidden>${esc(q.name)}</label>`).join('')}</div>
        <div class="q-help">Touche une pastille pour la cocher et voir son effet.</div>
        ${F.text('other', 'Autres', parsedA.other.join(', '), 'full', 'placeholder="séparés par des virgules"')}`,
      onOpen: (f) => wireQualityHelp(f, R.ARMOUR_QUALITIES),
      actions: [
        ...(i >= 0 ? [{ label: icon('trash'), cls: 'ghost', onClick: () => { c.armour.splice(i, 1); commit(); } }, 'spacer'] : []),
        cancel,
        { label: 'Enregistrer', primary: true, onClick: (f) => {
          Object.assign(a, { name: f.name.value.trim() || 'Armure', ap: num(f.ap.value), enc: num(f.enc.value), qualities: [...[...f.querySelectorAll('[name=aq]:checked')].map((x) => x.value), ...f.other.value.split(',').map((x) => x.trim()).filter(Boolean)].join(', '), locations: [...f.querySelectorAll('[name=loc]:checked')].map((x) => x.value) });
          if (i < 0) c.armour.push(a);
          commit();
        } },
      ],
    });
  },
  toggleEquip(el) { const a = C().armour[+el.dataset.i]; a.equipped = !a.equipped; commit(); },
  editItem(el) {
    editListItem('items', +el.dataset.i, 'Objet', [['name', 'Nom', 'text', 'full'], ['qty', 'Quantité', 'num'], ['enc', 'Enc (unité)', 'num'], ['notes', 'Notes', 'text', 'full']], { name: '', qty: 1, enc: 0, notes: '' });
  },
  qty(el) {
    const c = C(); const it = c.items[+el.dataset.i];
    it.qty = (it.qty ?? 1) + +el.dataset.d;
    if (it.qty <= 0) { confirmDialog('Retirer l\'objet ?', `Plus de « ${esc(it.name)} » dans le sac.`, 'Retirer', () => { c.items.splice(+el.dataset.i, 1); commit(); }); it.qty = 1; return; }
    commit();
  },
  editSpell(el) {
    const c = C(); const i = +el.dataset.i;
    const s = c.spells[i] || { name: '', lore: '', cn: '', range: '', target: '', duration: '', effect: '' };
    const keys = ['lore', 'cn', 'range', 'target', 'duration'];
    openDialog({
      title: i >= 0 ? s.name : 'Sort / prière',
      body: `<div class="fields">
        <div class="field full"><label>Nom</label><input name="name" list="spellNames" value="${esc(s.name)}" autocomplete="off" autofocus placeholder="Tape pour chercher dans la bibliothèque"></div>
        <datalist id="spellNames">${store.spells().map((x) => `<option value="${esc(x.name)}">${esc(x.lore || '')}</option>`).join('')}</datalist>
        <div class="full" id="spellHint"></div>
        ${F.text('lore', 'Tradition', s.lore || '', 'full')}${F.text('cn', 'NI', s.cn)}${F.text('range', 'Portée', s.range)}
        ${F.text('target', 'Cible', s.target)}${F.text('duration', 'Durée', s.duration)}${F.area('effect', 'Effets', s.effect)}
      </div>`,
      onOpen: (f) => {
        const upd = () => {
          const lib = store.findSpell(f.name.value);
          f.querySelector('#spellHint').innerHTML = lib && R.norm(lib.name) === R.norm(f.name.value) && i < 0
            ? '<p class="small muted" style="margin:0 0 8px">📚 Rempli depuis la bibliothèque.</p>' : '';
          if (!lib || i >= 0) return;
          for (const k of keys) f[k].value = lib[k] || '';
          f.effect.value = lib.desc || '';
        };
        f.name.oninput = upd;
      },
      actions: [
        ...(i >= 0 ? [{ label: icon('trash'), cls: 'ghost', onClick: () => { c.spells.splice(i, 1); commit(); } }, 'spacer'] : []),
        cancel,
        { label: 'Enregistrer', primary: true, onClick: (f) => {
          const lib = store.findSpell(f.name.value);
          s.name = (lib && R.norm(lib.name) === R.norm(f.name.value) ? lib.name : f.name.value.trim()) || 'Sort';
          for (const k of keys) s[k] = f[k].value.trim();
          s.effect = f.effect.value.trim();
          if (i < 0) c.spells.push(s);
          commit();
        } },
      ],
    });
  },
  libTab(el) { ui.libTab = el.dataset.t; ui.libSearch = ''; render(); },
  openSpellInfo(el) {
    const s = store.spells().find((x) => x.id === el.dataset.id);
    if (!s) return;
    const c = C();
    const have = c.spells.some((x) => R.norm(x.name) === R.norm(s.name));
    openDialog({
      title: s.name,
      body: `<p class="small muted" style="margin-top:0">${esc(s.lore || '')}${s.cn !== '' ? ` · NI ${esc(s.cn)}` : ''}</p>
        <p class="small">${spellMeta(c, s).map(esc).join('<br>')}</p>
        <p>${esc(s.desc || '')}</p>
        ${have ? `<p class="small muted">${esc(c.name)} connaît déjà ce sort.</p>` : ''}`,
      actions: [
        ...(store.canEditCareer(s) ? [{ label: icon('trash'), cls: 'ghost', onClick: () => { store.removeSpell(s.id); render(); } }, 'spacer'] : []),
        { label: 'Fermer', cls: 'ghost' },
        ...(!have ? [{ label: 'Ajouter à mon personnage', primary: true, onClick: () => {
          c.spells.push({ name: s.name, lore: s.lore, cn: s.cn, range: s.range, target: s.target, duration: s.duration, effect: s.desc });
          commit(); toast(`${s.name} ajouté au Carnet`);
        } }] : []),
      ],
    });
  },

  // --- Carrière ---
  editCareer() {
    const c = C(); const k = c.career;
    let shown = R.careerLevel(c);
    const mine = store.findCareer(k.name);
    const shareDefault = !mine || store.canEditCareer(mine);
    const panel = (n) => {
      const L = k.levels[n - 1];
      return `<div data-panel="${n}" ${n === shown ? '' : 'hidden'}>
        <div class="fields">${F.text(`title${n}`, `Titre (échelon ${n})`, L.title)}${F.text(`status${n}`, 'Statut', L.status, '', 'placeholder="ex. Bronze 2"')}</div>
        <div class="flabel">Caractéristiques augmentables à cet échelon</div>
        <div class="char-chips" style="margin:6px 0 10px">${R.CHARS.map((ch) => `<label class="chip" style="text-align:center"><input type="checkbox" name="chars${n}" value="${ch.key}" ${L.chars.includes(ch.key) ? 'checked' : ''} hidden>${ch.key}</label>`).join('')}</div>
        ${F.area(`skills${n}`, 'Compétences (une par ligne)', L.skills.join('\n'))}
        ${F.area(`talents${n}`, 'Talents (un par ligne)', L.talents.join('\n'))}
      </div>`;
    };
    openDialog({
      title: 'Schéma de carrière',
      body: `<div class="fields">${careerPickerFields(c.className, k.name)}${F.text('path', 'Schéma de carrière', k.path, 'full')}
        ${F.select('level', 'Échelon actuel', R.careerLevel(c), [1, 2, 3, 4], 'full')}</div>
        <div class="level-tabs">${[1, 2, 3, 4].map((n) => `<button type="button" class="chip ${n === shown ? 'on' : ''}" data-lt="${n}">Échelon ${n}</button>`).join('')}</div>
        ${[1, 2, 3, 4].map(panel).join('')}
        <p class="small muted">Recopie les éléments marqués pour chaque échelon dans ton livre. Ce qui figure aux échelons inférieurs reste « dans ta carrière ». Pour une compétence au choix, écris par exemple « Langue (au choix) ».</p>
        <label class="row small" style="margin-top:6px"><input type="checkbox" name="share" ${shareDefault ? 'checked' : ''} style="width:auto"> Enregistrer ce schéma dans la bibliothèque partagée avec mes camarades</label>`,
      onOpen: (f) => {
        f.querySelectorAll('[data-lt]').forEach((b) => b.onclick = () => {
          shown = +b.dataset.lt;
          f.querySelectorAll('[data-lt]').forEach((x) => x.classList.toggle('on', x === b));
          f.querySelectorAll('[data-panel]').forEach((p) => p.hidden = +p.dataset.panel !== shown);
        });
        wireCareerPicker(f, (tpl) => fillCareerForm(f, tpl));
      },
      actions: [cancel, { label: 'Enregistrer', primary: true, onClick: (f) => {
        k.name = f.name.value.trim(); k.path = f.path.value.trim(); k.level = +f.level.value;
        c.className = f.className.value.trim();
        const lines = (s) => s.split('\n').map((x) => x.trim()).filter(Boolean);
        for (let n = 1; n <= 4; n++) {
          Object.assign(k.levels[n - 1], {
            title: f[`title${n}`].value.trim(), status: f[`status${n}`].value.trim(),
            chars: [...f.querySelectorAll(`[name=chars${n}]:checked`)].map((x) => x.value),
            skills: lines(f[`skills${n}`].value), talents: lines(f[`talents${n}`].value),
          });
        }
        commit();
        if (f.share.checked && k.name && k.levels.some((l) => l.skills.length || l.talents.length || l.chars.length)) {
          const existing = store.findCareer(k.name);
          store.saveCareer({
            id: existing && store.canEditCareer(existing) ? existing.id : null,
            name: k.name, className: c.className, path: k.path, levels: JSON.parse(JSON.stringify(k.levels)),
          });
          toast(store.userUid ? 'Schéma partagé dans la bibliothèque' : 'Schéma enregistré (partagé dès que tu seras connecté)');
        }
      } }],
    });
  },
  openTalentInfo(el) {
    const t = store.talents().find((x) => x.id === el.dataset.id);
    if (!t) return;
    const c = C();
    const max = R.talentMax(c, t.max);
    const have = c.talents.find((x) => store.findTalent(x.name)?.id === t.id);
    openDialog({
      title: t.name,
      body: `${t.aliases?.length ? `<p class="small muted" style="margin-top:0">${esc(t.aliases.join(' · '))}</p>` : ''}
        <p class="small"><b>Max :</b> ${esc(t.max || '—')}${max != null ? ` (= ${max} pour ${esc(c.name)})` : ''}<br><b>Tests associés :</b> ${esc(t.tests || '—')}${t.sl ? '<br><b>+1 DR</b> aux tests associés' : ''}</p>
        <p>${esc(t.desc || '')}</p>
        ${have ? `<p class="small muted">${esc(c.name)} a ce talent (${have.times} fois).</p>` : ''}`,
      actions: [
        ...(store.canEditCareer(t) ? [{ label: icon('trash'), cls: 'ghost', onClick: () => { store.removeTalent(t.id); render(); } }, 'spacer'] : []),
        { label: 'Fermer', cls: 'ghost' },
        ...(!have ? [{ label: ui.levelUp ? 'Acheter' : 'Ajouter à mon personnage', primary: true, onClick: () => {
          if (ui.levelUp) { setTimeout(() => { A.editTalent({ dataset: { i: '-1' } }); const f = dlg.querySelector('form'); f.name.value = t.name; f.name.dispatchEvent(new Event('input')); }, 50); return; }
          c.talents.push({ name: t.name, times: 1, desc: '' }); commit(); toast(`${t.name} ajouté`);
        } }] : []),
      ],
    });
  },
  openCareerTemplate(el) {
    const t = store.careers().find((x) => x.id === el.dataset.id);
    if (!t) return;
    const c = C();
    const mineT = store.canEditCareer(t);
    openDialog({
      title: t.name,
      body: `<p class="small muted">${esc(t.className || 'Classe non précisée')} · ${mineT ? 'ton schéma' : `partagé par ${esc(t.authorName || 'un camarade')}`}</p>
        ${t.levels.map((l, i) => `<h3>Échelon ${i + 1}${l.title ? ` — ${esc(l.title)}` : ''}${l.status ? ` <span class="muted">(${esc(l.status)})</span>` : ''}</h3>
          <div class="small">${l.chars.length ? `<b>Caract. :</b> ${l.chars.join(', ')}<br>` : ''}${l.skills.length ? `<b>Compétences :</b> ${esc(l.skills.join(', '))}<br>` : ''}${l.talents.length ? `<b>Talents :</b> ${esc(l.talents.join(', '))}` : ''}</div>`).join('')}`,
      actions: [
        ...(mineT ? [{ label: icon('trash'), cls: 'ghost', onClick: () => { store.removeCareer(t.id); render(); toast('Schéma retiré de la bibliothèque'); } }, 'spacer'] : []),
        { label: 'Fermer', cls: 'ghost' },
        { label: 'Utiliser pour mon personnage', primary: true, onClick: () => {
          applyTemplate(c, t); commit(); toast(`Schéma « ${t.name} » appliqué`);
        } },
      ],
    });
  },
  nextLevel() {
    const c = C(); const lvl = R.careerLevel(c);
    const next = c.career.levels[lvl]?.title || `échelon ${lvl + 1}`;
    confirmDialog('Échelon suivant', `Devenir <b>${esc(next)}</b> pour ${R.LEVEL_UP_COST} XP ?`, 'Confirmer', () => {
      if (spend(c, R.LEVEL_UP_COST, `Échelon ${lvl + 1} : ${next}`, { type: 'level', prev: lvl })) { c.career.level = lvl + 1; commit(); toast(`Tu es maintenant ${next} !`); }
    });
  },
  changeCareer() {
    const c = C(); const p = R.careerProgress(c); const cost = R.careerChangeCost(p.complete);
    openDialog({
      title: 'Changer de carrière',
      body: `<div class="fields">${careerPickerFields('', '', 'Nouvelle carrière')}</div><div class="cost-line">Coût : <b>${cost} XP</b> ${p.complete ? '(échelon actuel terminé)' : '(échelon actuel non terminé)'}</div><p class="small muted">Si la carrière est dans la bibliothèque, son schéma est repris automatiquement. Tu pourras le vérifier ensuite.</p>`,
      onOpen: (f) => wireCareerPicker(f),
      actions: [cancel, { label: 'Changer', cls: 'gold', primary: true, onClick: (f) => {
        const name = f.name.value.trim();
        if (!name) { toast('Indique la nouvelle carrière'); return false; }
        const prev = JSON.parse(JSON.stringify(c.career));
        const prevClass = c.className;
        if (!spend(c, cost, `Nouvelle carrière : ${name}`, { type: 'career', prevCareer: prev, prevClass })) return false;
        c.careerHistory.push({ name: prev.name, level: R.careerLevel(c), title: prev.levels[R.careerLevel(c) - 1]?.title, className: prevClass });
        c.career = { name, level: 1, path: '', levels: [1, 2, 3, 4].map(() => ({ title: '', status: '', chars: [], skills: [], talents: [] })) };
        c.className = f.className.value.trim() || R.classOfCareer(name);
        const tpl = store.findCareer(name);
        if (tpl) applyTemplate(c, tpl);
        commit();
        setTimeout(() => A.editCareer(), 50);
      } }],
    });
  },

  // --- Personnages & menu ---
  characters() {
    const cur = C();
    openDialog({
      title: 'Personnages',
      body: `<div class="char-list">${store.list().map((c) => `<button type="button" class="list-item ${c.id === cur.id ? 'current' : ''}" data-pick="${c.id}"><span class="crest" style="width:36px;height:36px;font-size:15px">${esc((c.name || '?').charAt(0).toUpperCase())}</span><span class="li-main"><div class="li-title">${esc(c.name)}</div><div class="li-sub">${esc([c.species, c.career.name].filter(Boolean).join(' · '))}</div></span>${c.id === cur.id ? icon('check') : ''}</button>`).join('')}</div>`,
      onOpen: (f) => f.querySelectorAll('[data-pick]').forEach((b) => b.onclick = () => { store.select(b.dataset.pick); dlg.close(); ui.levelUp = false; render(); }),
      actions: [{ label: 'Fermer', cls: 'ghost' }, { label: `${icon('plus')} Nouveau`, onClick: () => { setTimeout(A.newCharacter, 50); } }],
    });
  },
  newCharacter() {
    openDialog({
      title: 'Nouveau personnage',
      body: `${F.text('name', 'Nom', '', '', 'autofocus required')}${F.select('species', 'Race', 'Humain', Object.keys(R.SPECIES))}
        <div class="field"><label>Carrière</label>${careerSelect('', 'newCareer')}
          <input name="newCareerOther" placeholder="Nom de la carrière" autocomplete="off" hidden style="margin-top:6px"></div>
        <div class="field" id="newClassRow" hidden><label>Classe</label><div class="cls-auto" id="newClassAuto"></div>
          <div id="newClassManual" hidden>${classPicker('')}</div></div>
        <div id="newCareerHint"></div>
        <p class="small muted">Saisis ensuite tes caractéristiques initiales (onglet Fiche).</p>`,
      onOpen: (f) => {
        const upd = () => {
          const v = f.newCareer.value;
          const other = v === '__other';
          f.newCareerOther.hidden = !other;
          f.querySelector('#newClassRow').hidden = !v;
          f.querySelector('#newClassAuto').hidden = other;
          f.querySelector('#newClassManual').hidden = !other;
          if (!other) {
            f.className.value = classForCareer(v);
            f.querySelector('#newClassAuto').innerHTML = `${esc(f.className.value || '—')} <span class="small muted">(déduite de la carrière)</span>`;
          } else { f.className.value = ''; syncClassPick(f); f.newCareerOther.focus(); }
          const tpl = !other && v && store.findCareer(v);
          f.querySelector('#newCareerHint').innerHTML = tpl ? `<div class="cost-line">📚 Le schéma de « ${esc(tpl.name)} » sera chargé depuis la bibliothèque.</div>` : '';
        };
        f.newCareer.addEventListener('change', upd);
      },
      actions: [cancel, { label: 'Créer', primary: true, onClick: (f) => {
        const c = R.newCharacter(f.name.value.trim() || 'Nouveau personnage', f.species.value);
        const career = f.newCareer.value === '__other' ? f.newCareerOther.value.trim() : f.newCareer.value;
        if (career) {
          c.career.name = career;
          c.className = f.className.value.trim() || classForCareer(career);
          const tpl = store.findCareer(career);
          if (tpl) applyTemplate(c, tpl);
        }
        store.add(c); ui.tab = 'fiche'; render();
        toast(career ? `${c.name}, ${career}${c.className ? ` (${c.className})` : ''}` : `${c.name} créé`);
      } }],
    });
  },
  menu() {
    const st = store.status; const m = store.meta;
    openDialog({
      title: 'Menu',
      body: `<h3>${icon('cloud')} Sauvegarde en ligne</h3>
        <p class="small">État : <b>${esc(st.message || 'inactif')}</b>${m.lastSync ? `<br>Dernière synchro : ${new Date(m.lastSync).toLocaleString('fr-FR')}` : ''}${m.dirty ? '<br>Des modifications attendent d\'être envoyées.' : ''}</p>
        <details ${store.configured ? '' : 'open'} style="margin-bottom:10px"><summary class="small muted" style="cursor:pointer">Configuration Firebase</summary>
          <div class="field" style="margin-top:8px"><textarea name="fbconfig" placeholder="Colle ici le bloc firebaseConfig = { apiKey: ..., projectId: ... } (voir README)" style="font-family:monospace;font-size:13px">${m.firebase ? esc(JSON.stringify(m.firebase, null, 2)) : ''}</textarea></div>
        </details>
        <div class="row">
          <button type="button" class="btn small" data-m="connect">${store.userEmail ? 'Synchroniser maintenant' : 'Se connecter avec Google'}</button>
          ${store.userEmail ? '<button type="button" class="btn ghost small" data-m="disconnect">Se déconnecter</button>' : ''}
        </div>
        <h3>Sauvegarde</h3>
        <div class="row">
          <button type="button" class="btn ghost small" data-m="export">${icon('down')} Exporter (JSON)</button>
          <button type="button" class="btn ghost small" data-m="import">${icon('upload')} Importer</button>
          <input type="file" accept=".json,application/json" hidden id="importFile">
        </div>
        <h3>Ambiance</h3>
        <div class="row">
          <label class="row small" style="flex:1"><input type="checkbox" id="scareToggle" ${localStorage.getItem('whfrp4.scare') === 'off' ? '' : 'checked'} style="width:auto"> Effets quand la Corruption monte (Chaos) ou baisse (Sigmar)</label>
          <button type="button" class="btn ghost small" id="scareTry">Chaos</button>
          <button type="button" class="btn ghost small" id="purifyTry">Sigmar</button>
        </div>
        <h3>Personnage</h3>
        <div class="row">
          <button type="button" class="btn ghost small" data-m="duplicate">Dupliquer</button>
          <button type="button" class="btn ghost small" style="color:var(--blood)" data-m="delete">${icon('trash')} Supprimer « ${esc(C().name)} »</button>
        </div>`,
      onOpen: (f) => {
        const saveCfg = () => {
          const before = JSON.stringify(m.firebase);
          try { store.setFirebaseConfig(f.fbconfig.value); } catch (e) { toast(`Configuration invalide : ${e.message}`); return false; }
          if (before !== JSON.stringify(m.firebase) && before !== 'null') { toast('Configuration changée : l\'appli redémarre'); setTimeout(() => location.reload(), 800); return false; }
          return true;
        };
        f.querySelector('[data-m=connect]').onclick = async () => {
          if (!saveCfg()) return;
          dlg.close(); await store.sync({ interactive: true }); toast(store.status.message);
        };
        f.querySelector('[data-m=disconnect]')?.addEventListener('click', async () => { dlg.close(); await store.disconnect(); render(); });
        f.querySelector('[data-m=export]').onclick = () => {
          const blob = new Blob([store.exportAll()], { type: 'application/json' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob); a.download = `wfrp-personnages-${new Date().toISOString().slice(0, 10)}.json`; a.click();
          setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        };
        f.querySelector('#scareToggle').onchange = (e) => { localStorage.setItem('whfrp4.scare', e.target.checked ? 'on' : 'off'); };
        f.querySelector('#scareTry').onclick = () => {
          if (!f.querySelector('#scareToggle').checked) { toast("Active d'abord l'effet"); return; }
          dlg.close(); corruptionScare(C());
        };
        f.querySelector('#purifyTry').onclick = () => {
          if (!f.querySelector('#scareToggle').checked) { toast("Active d'abord l'effet"); return; }
          dlg.close(); purifyEffect(C());
        };
        const file = f.querySelector('#importFile');
        f.querySelector('[data-m=import]').onclick = () => file.click();
        file.onchange = async () => {
          try {
            const n = store.importAll(await file.files[0].text());
            dlg.close(); render();
            toast(n?.careers != null ? `${n.careers} carrière(s) ajoutée(s) à la bibliothèque`
              : n?.talents != null ? `${n.talents} talent(s) ajouté(s) à la bibliothèque`
              : n?.spells != null ? `${n.spells} sort(s) ajouté(s) à la bibliothèque`
              : `${n} personnage(s) importé(s)`);
          } catch { toast('Fichier invalide'); }
        };
        f.querySelector('[data-m=duplicate]').onclick = () => {
          const copy = JSON.parse(JSON.stringify(C())); copy.id = R.uid(); copy.name += ' (copie)'; copy.updatedAt = Date.now();
          store.add(copy); dlg.close(); render(); toast('Personnage dupliqué');
        };
        f.querySelector('[data-m=delete]').onclick = () => {
          const c = C();
          setTimeout(() => confirmDialog('Supprimer le personnage ?', `« ${esc(c.name)} » sera supprimé sur tous tes appareils. Pense à l'exporter avant si tu veux le garder.`, 'Supprimer', () => { store.remove(c.id); render(); }), 50);
          dlg.close();
        };
      },
      actions: [{ label: 'Fermer', cls: 'ghost' }],
    });
  },
  async syncNow() {
    if (!store.configured) { A.menu(); toast('Configure d\'abord la sauvegarde en ligne'); return; }
    await store.sync({ interactive: true });
    toast(store.status.message);
  },
};

// ---------- Effet de corruption (« jumpscare ») ----------
const WHISPERS = [
  'Les Dieux Sombres ont entendu ton nom…', 'Quelque chose remue sous ta peau…',
  'Le Warp murmure, et tu écoutes…', 'Une voix rit au fond de ton crâne…',
  'Tes rêves ont le goût de la cendre…', 'Tes ombres ne te suivent plus tout à fait…',
];

function scareSound(level) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const t = ctx.currentTime;
    const dur = 3.2;
    const vol = 0.55 + level * 0.07;

    // Réverbération de caverne : réponse impulsionnelle faite de bruit qui s'éteint
    const rev = ctx.createConvolver();
    const ir = ctx.createBuffer(2, ctx.sampleRate * 3, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
    }
    rev.buffer = ir;
    const out = ctx.createGain(); out.gain.value = vol; out.connect(ctx.destination);
    const wet = ctx.createGain(); wet.gain.value = 0.7; rev.connect(wet); wet.connect(out);
    const bus = ctx.createGain(); bus.connect(out); bus.connect(rev);

    // Distorsion légère pour salir le son
    const shaper = ctx.createWaveShaper();
    const curve = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; curve[i] = Math.tanh(x * 3); }
    shaper.curve = curve; shaper.connect(bus);

    const env = (node, a, peak, hold, rel) => {
      node.gain.setValueAtTime(0.0001, t);
      node.gain.exponentialRampToValueAtTime(peak, t + a);
      node.gain.setValueAtTime(peak, t + a + hold);
      node.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + rel);
    };

    // 1. Impact : sinus grave qui plonge + claquement de bruit
    const boom = ctx.createOscillator(); boom.type = 'sine';
    boom.frequency.setValueAtTime(90, t); boom.frequency.exponentialRampToValueAtTime(28, t + 1.2);
    const boomG = ctx.createGain(); env(boomG, 0.005, 1.2, 0.05, 1.4);
    boom.connect(boomG); boomG.connect(shaper); boom.start(t); boom.stop(t + dur);

    // 2. Accord dissonant (demi-tons et triton), cordes grinçantes filtrées qui s'ouvrent
    const drone = ctx.createBiquadFilter(); drone.type = 'lowpass';
    drone.frequency.setValueAtTime(300, t); drone.frequency.exponentialRampToValueAtTime(2400, t + 2.2);
    drone.Q.value = 6; drone.connect(bus);
    const droneG = ctx.createGain(); env(droneG, 0.6, 0.22, 1.2, 1.3); droneG.connect(drone);
    for (const f of [110, 116.5, 155.6, 164.8, 233]) {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 5 + Math.random() * 3;
      const lfoG = ctx.createGain(); lfoG.gain.value = f * 0.012; lfo.connect(lfoG); lfoG.connect(o.frequency);
      o.connect(droneG); o.start(t); lfo.start(t); o.stop(t + dur); lfo.stop(t + dur);
    }

    // 3. Crissement métallique : modulation de fréquence aiguë qui glisse, avec vibrato
    const car = ctx.createOscillator(); car.type = 'triangle';
    car.frequency.setValueAtTime(1800, t + 0.15); car.frequency.exponentialRampToValueAtTime(2900, t + 0.9);
    car.frequency.exponentialRampToValueAtTime(900, t + 2.4);
    const mod = ctx.createOscillator(); mod.frequency.value = 437;
    const modG = ctx.createGain(); modG.gain.value = 900; mod.connect(modG); modG.connect(car.frequency);
    const vib = ctx.createOscillator(); vib.frequency.value = 9;
    const vibG = ctx.createGain(); vibG.gain.value = 60; vib.connect(vibG); vibG.connect(car.frequency);
    const scrG = ctx.createGain();
    scrG.gain.setValueAtTime(0.0001, t); scrG.gain.setValueAtTime(0.0001, t + 0.15);
    scrG.gain.exponentialRampToValueAtTime(0.09, t + 0.4); scrG.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
    car.connect(scrG); scrG.connect(bus);
    [car, mod, vib].forEach((o) => { o.start(t); o.stop(t + dur); });

    // 4. Souffle chuchoté qui palpite
    const nbuf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const nd = nbuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource(); noise.buffer = nbuf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 3;
    const nG = ctx.createGain(); env(nG, 0.3, 0.25, 1.4, 1.2);
    const trem = ctx.createOscillator(); trem.frequency.value = 6;
    const tremG = ctx.createGain(); tremG.gain.value = 0.15; trem.connect(tremG); tremG.connect(nG.gain);
    noise.connect(bp); bp.connect(nG); nG.connect(bus);
    noise.start(t); trem.start(t); trem.stop(t + dur);

    setTimeout(() => ctx.close(), (dur + 3) * 1000);
  } catch { /* pas de son disponible */ }
}

function corruptionScare(c) {
  if (localStorage.getItem('whfrp4.scare') === 'off') return;
  const level = Math.min(5, +c.corruption || 1);
  const over = (+c.corruption || 0) > R.corruptionMax(c);
  const gentle = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  document.getElementById('scare')?.remove();
  const el = document.createElement('div');
  el.id = 'scare';
  el.className = `scare ${gentle ? 'gentle' : ''} lvl${level}`;
  el.innerHTML = `<img class="scare-img" src="img/chaos.webp" alt="">
    <div class="scare-text">${over ? '<b>Test de mutation !</b>' : esc(WHISPERS[Math.floor(Math.random() * WHISPERS.length)])}</div>
    <div class="scare-count">Corruption ${c.corruption} / ${R.corruptionMax(c)}</div>`;
  document.body.appendChild(el);
  if (!gentle) { scareSound(level); navigator.vibrate?.([90, 40, 160, 40, 60 * level]); }
  const close = () => { el.classList.add('out'); setTimeout(() => el.remove(), 400); };
  el.addEventListener('click', close);
  setTimeout(close, over ? 3600 : 2600);
}

// ---------- Effet de purification (la Corruption baisse) ----------
const BLESSINGS = [
  'Une lumière chasse les ténèbres…', 'Ton âme s\'allège d\'un poids ancien…',
  'Le marteau du Dieu-Roi veille sur toi…', 'Les ombres reculent devant ta foi…',
  'Une chaleur dorée apaise ton esprit…', 'Le murmure se tait. Enfin.',
];

function angelicSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const t = ctx.currentTime;
    const dur = 4.2;
    // Réverbération de cathédrale : longue et douce
    const rev = ctx.createConvolver();
    const ir = ctx.createBuffer(2, ctx.sampleRate * 4.5, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
    }
    rev.buffer = ir;
    const out = ctx.createGain(); out.gain.value = 0.5; out.connect(ctx.destination);
    const wet = ctx.createGain(); wet.gain.value = 0.9; rev.connect(wet); wet.connect(out);
    const bus = ctx.createGain(); bus.gain.value = 0.6; bus.connect(out); bus.connect(rev);

    // Chœur : accord de ré majeur (avec la neuvième), voix douces légèrement désaccordées et vibrato
    const choirF = ctx.createBiquadFilter(); choirF.type = 'lowpass'; choirF.frequency.value = 2200; choirF.connect(bus);
    const choirG = ctx.createGain();
    choirG.gain.setValueAtTime(0.0001, t);
    choirG.gain.exponentialRampToValueAtTime(0.16, t + 1.2);
    choirG.gain.setValueAtTime(0.16, t + 2.4);
    choirG.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    choirG.connect(choirF);
    for (const f of [146.8, 220, 293.7, 370, 440, 659.3]) {
      for (const det of [-6, 6]) {
        const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f; o.detune.value = det;
        const vib = ctx.createOscillator(); vib.frequency.value = 4.5 + Math.random();
        const vibG = ctx.createGain(); vibG.gain.value = f * 0.006; vib.connect(vibG); vibG.connect(o.frequency);
        o.connect(choirG); o.start(t); vib.start(t); o.stop(t + dur); vib.stop(t + dur);
      }
    }
    // « Aaah » : formant de voyelle sur le chœur
    const formant = ctx.createBiquadFilter(); formant.type = 'peaking'; formant.frequency.value = 800; formant.gain.value = 8; formant.Q.value = 2;
    choirF.disconnect(); choirF.connect(formant); formant.connect(bus);

    // Clochettes cristallines : arpège montant qui scintille
    [1174.7, 1480, 1760, 2349.3, 2960].forEach((f, i) => {
      const st = t + 0.35 + i * 0.22;
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 2.76;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, st);
      g.gain.exponentialRampToValueAtTime(0.12, st + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, st + 2);
      const g2 = ctx.createGain(); g2.gain.value = 0.3;
      o.connect(g); o2.connect(g2); g2.connect(g); g.connect(bus);
      o.start(st); o2.start(st); o.stop(st + 2.1); o2.stop(st + 2.1);
    });
    setTimeout(() => ctx.close(), (dur + 4.5) * 1000);
  } catch { /* pas de son disponible */ }
}

function purifyEffect(c) {
  if (localStorage.getItem('whfrp4.scare') === 'off') return;
  const gentle = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  document.getElementById('scare')?.remove();
  const el = document.createElement('div');
  el.id = 'scare';
  el.className = `scare holy ${gentle ? 'gentle' : ''}`;
  el.innerHTML = `<img class="scare-img" src="img/sigmar.webp" alt="">
    <div class="holy-light"></div>
    <div class="scare-text">${esc(BLESSINGS[Math.floor(Math.random() * BLESSINGS.length)])}</div>
    <div class="scare-count">Corruption ${c.corruption} / ${R.corruptionMax(c)}</div>`;
  document.body.appendChild(el);
  if (!gentle) angelicSound();
  const close = () => { el.classList.add('out'); setTimeout(() => el.remove(), 500); };
  el.addEventListener('click', close);
  setTimeout(close, 3400);
}

// ---------- Lanceur de dés ----------
function openRoll({ title, label, base, combat = false, weapon = null, parryWeapon = null, spell = null, channel = false }) {
  const c = C();
  const adv = +c.health.advantage || 0;
  let last = null;
  openDialog({
    title,
    body: `<p class="small muted" style="margin-top:0">${esc(label)} : <b>${base}</b></p>
      <div class="fields">
        ${F.select('diff', 'Difficulté', '0', R.DIFFICULTIES)}
        ${F.num('mod', 'Autre modificateur', 0)}
      </div>
      ${combat && adv ? `<label class="row small" style="margin:0 0 8px"><input type="checkbox" name="useAdv" checked style="width:auto"> Avantage : +${adv * 10}</label>` : ''}
      ${weapon && R.hasQuality(weapon, 'acc10') ? `<label class="row small" style="margin:0 0 8px"><input type="checkbox" name="useAcc" checked style="width:auto"> ⚙ Précise : +10</label>` : ''}
      <div class="roll-target">Cible : <b id="rTarget"></b></div>
      <div class="row" style="margin:10px 0">
        <button type="button" class="btn gold" id="rRandom" style="flex:1">${icon('die')} Lancer les dés</button>
        <input type="number" inputmode="numeric" name="manual" min="1" max="100" placeholder="ou mon jet" style="width:110px">
        <button type="button" class="btn ghost" id="rManual">OK</button>
      </div>
      <div id="rResult"></div>`,
    onOpen: (f) => {
      const target = () => Math.max(0, base + num(f.diff.value) + num(f.mod.value) + (f.useAdv?.checked ? adv * 10 : 0) + (f.useAcc?.checked ? 10 : 0));
      const showTarget = () => { f.querySelector('#rTarget').textContent = target(); };
      [f.diff, f.mod, f.useAdv, f.useAcc].forEach((x) => x?.addEventListener('input', showTarget));
      [f.useAdv, f.useAcc].forEach((x) => x?.addEventListener('change', showTarget));
      f.diff.addEventListener('change', showTarget);
      showTarget();
      const show = (roll) => {
        const r = R.rollResult(target(), roll);
        last = r;
        const units = r.roll % 10;
        const notes = [];
        // Atouts / défauts appliqués automatiquement
        if (weapon && r.success) {
          if (R.hasQuality(weapon, 'hit+1')) { r.sl += 1; notes.push('Pointue : +1 DR'); }
          if (R.hasQuality(weapon, 'hit-1')) { r.sl = Math.max(0, r.sl - 1); notes.push('Imprécise : −1 DR'); }
          if (R.hasQuality(weapon, 'crit10') && units === 0 && !r.critical) { r.critical = true; notes.push('Empalé : critique sur un 0'); }
        }
        if (parryWeapon && r.success && R.hasQuality(parryWeapon, 'parry+1')) { r.sl += 1; notes.push(`Défensif (${parryWeapon.name}) : +1 DR`); }
        const verdict = r.critical ? 'Réussite critique !' : r.fumble ? 'Maladresse !' : r.success ? 'Réussite' : 'Échec';
        let extra = notes.length ? `<div class="roll-line q-auto">⚙ ${notes.map(esc).join(' · ')}</div>` : '';
        if (weapon && r.success) {
          const hit = R.hitLocation(r.roll);
          const d = R.weaponDamage(c, weapon);
          let bonus = r.sl; let how = `${r.sl} DR`;
          if (R.hasQuality(weapon, 'dmgBest') && units > r.sl) { bonus = units; how = `${units} (unités, Endommageant)`; }
          if (R.hasQuality(weapon, 'dmgUnits')) { bonus += units; how += ` + ${units} (unités, Impact)`; }
          extra += `<div class="roll-line">Touché : <b>${hit.name}</b> <span class="muted">(${String(hit.n).padStart(2, '0')})</span></div>
            <div class="roll-line">Dégâts : <b>${d != null ? `${d + bonus}` : `${esc(weapon.damage)} + ${bonus}`}</b> <span class="muted">(${d != null ? `${d} + ${how}` : `arme + ${how}`}) — avant BE et PA de la cible</span></div>
            ${r.critical ? '<div class="roll-line"><b>Coup critique</b> : jet sur la table des blessures critiques.</div>' : ''}`;
        } else if (weapon && r.fumble) {
          extra += '<div class="roll-line">Fais un jet sur la table des <b>maladresses</b>.</div>';
        }
        // Sort : NI à atteindre (réduit par la focalisation) ; prière : réussite simple ; focalisation : DR ajoutés au compteur
        if (spell && !spell.prayer) {
          const focus = +c.magicFocus || 0;
          const need = Math.max(0, spell.cn - focus);
          const cast = r.success && r.sl >= need;
          extra += `<div class="roll-line spell-out ${cast ? 'ok' : 'ko'}">${cast ? '✨ <b>Le sort est lancé !</b>' : '<b>Le sort ne part pas.</b>'} <span class="muted">(NI ${spell.cn}${focus ? ` − ${focus} focalisés = ${need}` : ''}, DR ${r.sl})</span></div>`;
          if (cast && focus) { c.magicFocus = 0; commit(false); extra += '<div class="roll-line small muted">Focalisation remise à 0.</div>'; }
        }
        if (spell && spell.prayer) {
          extra += `<div class="roll-line spell-out ${r.success ? 'ok' : 'ko'}">${r.success ? '🙏 <b>La prière est entendue.</b>' : '<b>La prière reste sans réponse.</b>'} <span class="muted">(DR ${r.sl})</span></div>`;
        }
        if (channel) {
          if (r.success) {
            const add = Math.max(1, r.sl);
            c.magicFocus = (+c.magicFocus || 0) + add; commit(false);
            extra += `<div class="roll-line spell-out ok">+${add} DR focalisés : total <b>${c.magicFocus}</b>.</div>`;
          } else extra += '<div class="roll-line spell-out ko">La focalisation échoue.</div>';
        }
        if ((spell || channel) && r.roll < 100 && r.roll % 11 === 0) extra += '<div class="roll-line"><b>Double !</b> Risque d’incident (ou de colère divine pour une prière) : voir le livre.</div>';
        // Rappels des autres atouts / défauts de l'arme
        const remind = weapon || parryWeapon;
        if (remind) {
          const { known, other } = R.parseQualities(remind.qualities);
          const rows = known.filter(({ q }) => !q.auto).map(({ q, rating }) => `<li><span class="q-tag ${q.kind === 'atout' ? 'pro' : 'con'}">${esc(q.name)}${rating ? ` ${rating}` : ''}</span> ${esc(q.desc)}</li>`)
            .concat(other.map((o) => `<li><span class="q-tag">${esc(o)}</span></li>`));
          if (rows.length) extra += `<ul class="q-remind">${rows.join('')}</ul>`;
        }
        const fortune = +c.fate.fortune || 0;
        f.querySelector('#rResult').innerHTML = `<div class="roll-res ${r.success ? 'ok' : 'ko'}">
            <div class="roll-die">${r.roll === 100 ? '00' : String(r.roll).padStart(2, '0')}</div>
            <div><div class="roll-verdict">${verdict}</div><div class="roll-sl">${r.sl >= 0 ? '+' : ''}${r.sl} DR <span class="muted small">(cible ${r.target})</span></div></div>
          </div>${extra}
          <div class="row" style="margin-top:10px">
            ${!r.success && fortune ? `<button type="button" class="btn small" id="rFortune">Relancer (1 Chance · reste ${fortune})</button>` : ''}
            ${combat && r.success ? '<button type="button" class="btn green small" id="rAdv">+1 Avantage</button>' : ''}
          </div>`;
        f.querySelector('#rFortune')?.addEventListener('click', () => {
          c.fate.fortune = Math.max(0, (+c.fate.fortune || 0) - 1); commit(false);
          show(1 + Math.floor(Math.random() * 100));
          toast('Relance : 1 point de Chance dépensé');
        });
        f.querySelector('#rAdv')?.addEventListener('click', (e) => {
          c.health.advantage = (+c.health.advantage || 0) + 1; commit(false);
          e.target.disabled = true; e.target.textContent = `Avantage : ${c.health.advantage}`;
        });
      };
      f.querySelector('#rRandom').addEventListener('click', () => show(1 + Math.floor(Math.random() * 100)));
      f.querySelector('#rManual').addEventListener('click', () => {
        const v = num(f.manual.value);
        if (v < 1 || v > 100) { toast('Entre un jet de 1 à 100'); return; }
        show(v);
      });
    },
    actions: [{ label: 'Fermer', cls: 'ghost', onClick: () => { render(); } }],
  });
}

// ---------- Classe et carrière : sélecteur commun ----------
// Liste déroulante des 8 classes ; « Autre… » affiche un champ libre. La valeur réelle est dans input[name=className].
function classPicker(value, inputAttrs = '') {
  const known = Object.keys(R.CLASSES);
  const custom = !!value && !known.includes(value);
  return `<select name="classPick" data-classpick>
      <option value="" ${!value ? 'selected' : ''}>— Choisir une classe —</option>
      ${known.map((k) => `<option value="${esc(k)}" ${k === value ? 'selected' : ''}>${esc(k)}</option>`).join('')}
      <option value="__other" ${custom ? 'selected' : ''}>Autre…</option>
    </select>
    <input name="className" value="${esc(value)}" placeholder="Nom de la classe" autocomplete="off" ${custom ? '' : 'hidden'} ${inputAttrs} style="margin-top:6px">`;
}

document.addEventListener('change', (e) => {
  const sel = e.target.closest?.('[data-classpick]');
  if (!sel) return;
  const input = sel.parentElement.querySelector('input[name=className]');
  if (sel.value === '__other') { input.hidden = false; input.value = ''; input.focus(); return; }
  input.hidden = true;
  input.value = sel.value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
});

// Met la liste déroulante à jour quand la classe est remplie automatiquement (depuis la carrière)
function syncClassPick(f) {
  const sel = f.querySelector('[data-classpick]');
  if (!sel) return;
  const v = f.className.value;
  const known = Object.keys(R.CLASSES).includes(v);
  sel.value = !v ? '' : known ? v : '__other';
  f.className.hidden = !v || known;
}

// Toutes les carrières connues, rangées par classe (liste de l'appli + bibliothèque) : [[classe, [noms]]]
function careerGroups() {
  const groups = Object.entries(R.CLASSES).map(([cls, list]) => [cls, [...list]]);
  const others = [];
  for (const t of store.careers()) {
    const g = groups.find(([cls]) => cls === t.className);
    const target = g ? g[1] : others;
    if (!target.some((n) => R.norm(n) === R.norm(t.name))) target.push(t.name);
  }
  if (others.length) groups.push(['Autres', others]);
  return groups.map(([cls, names]) => [cls, names.sort((a, b) => a.localeCompare(b, 'fr'))]);
}
const isKnownCareer = (name) => careerGroups().some(([, names]) => names.some((n) => R.norm(n) === R.norm(name)));
const classForCareer = (name) => R.classOfCareer(name) || store.findCareer(name)?.className || '';

function careerSelect(value, name = 'careerPick') {
  const custom = !!value && !isKnownCareer(value);
  return `<select name="${name}" data-careerpick>
      <option value="" ${!value ? 'selected' : ''}>— Choisir une carrière —</option>
      ${careerGroups().map(([cls, names]) => `<optgroup label="${esc(cls)}">${names.map((n) => `<option value="${esc(n)}" ${R.norm(n) === R.norm(value) ? 'selected' : ''}>${esc(n)}${store.findCareer(n) ? ' 📚' : ''}</option>`).join('')}</optgroup>`).join('')}
      <option value="__other" ${custom ? 'selected' : ''}>Autre carrière…</option>
    </select>`;
}

function careerPickerFields(className, careerName, label = 'Carrière') {
  const custom = !!careerName && !isKnownCareer(careerName);
  return `<div class="field full"><label>${label}</label>${careerSelect(careerName)}
      <input name="name" value="${esc(careerName)}" placeholder="Nom de la carrière" autocomplete="off" ${custom ? '' : 'hidden'} style="margin-top:6px"></div>
    <div class="field full"><label>Classe</label>
      <div id="classAuto" class="cls-auto" ${custom ? 'hidden' : ''}>${esc(className || classForCareer(careerName) || '—')} <span class="small muted">(déduite de la carrière)</span></div>
      <div id="classManual" ${custom ? '' : 'hidden'}>${classPicker(className)}</div></div>
    <div class="full" id="libHint"></div>`;
}

// Met la liste des carrières à jour quand le nom est rempli depuis la bibliothèque
function syncCareerPick(f) {
  const sel = f.querySelector('[data-careerpick]');
  if (!sel) return;
  const known = isKnownCareer(f.name.value);
  sel.value = !f.name.value ? '' : known ? [...sel.options].find((o) => R.norm(o.value) === R.norm(f.name.value))?.value : '__other';
  f.name.hidden = known || !f.name.value;
}

function wireCareerPicker(f, onLoad) {
  const hint = f.querySelector('#libHint');
  const sel = f.querySelector('[data-careerpick]');
  const showClass = (custom) => {
    f.querySelector('#classAuto').hidden = custom;
    f.querySelector('#classManual').hidden = !custom;
    if (!custom) f.querySelector('#classAuto').innerHTML = `${esc(f.className.value || '—')} <span class="small muted">(déduite de la carrière)</span>`;
  };
  sel.addEventListener('change', () => {
    if (sel.value === '__other') {
      f.name.hidden = false; f.name.value = ''; f.name.focus();
      showClass(true);
    } else {
      f.name.hidden = true; f.name.value = sel.value;
      f.className.value = classForCareer(sel.value); syncClassPick(f);
      showClass(false);
    }
    refreshHint();
  });
  const refreshHint = () => {
    const name = f.name.value.trim();
    const tpl = name && store.findCareer(name);
    if (!tpl) { hint.innerHTML = ''; return; }
    const who = store.canEditCareer(tpl) ? 'ton schéma' : `partagé par ${esc(tpl.authorName || 'un camarade')}`;
    hint.innerHTML = onLoad
      ? `<div class="cost-line">📚 « ${esc(tpl.name)} » existe dans la bibliothèque (${who}). <button type="button" class="btn gold small" id="loadTpl" style="margin-left:6px">Charger ce schéma</button></div>`
      : `<div class="cost-line">📚 Le schéma de « ${esc(tpl.name)} » (${who}) sera repris automatiquement.</div>`;
    hint.querySelector('#loadTpl')?.addEventListener('click', () => { onLoad(tpl); toast('Schéma chargé : vérifie-le puis enregistre'); });
  };
  f.name.addEventListener('input', refreshHint);
  refreshHint();
}

function fillCareerForm(f, tpl) {
  f.name.value = tpl.name;
  syncCareerPick(f);
  if (tpl.className) { f.className.value = tpl.className; syncClassPick(f); }
  f.path.value = tpl.path || '';
  tpl.levels.forEach((L, i) => {
    const n = i + 1;
    f[`title${n}`].value = L.title || ''; f[`status${n}`].value = L.status || '';
    f.querySelectorAll(`[name=chars${n}]`).forEach((x) => { x.checked = (L.chars || []).includes(x.value); });
    f[`skills${n}`].value = (L.skills || []).join('\n'); f[`talents${n}`].value = (L.talents || []).join('\n');
  });
}

function applyTemplate(c, tpl) {
  c.career.name = tpl.name;
  c.career.path = tpl.path || '';
  c.career.levels = JSON.parse(JSON.stringify(tpl.levels));
  if (tpl.className) c.className = tpl.className;
}

function editListItem(list, i, title, fields, defaults) {
  const c = C(); const item = c[list][i] || { ...defaults };
  openDialog({
    title: i >= 0 ? item.name || title : title,
    body: `<div class="fields">${fields.map(([k, label, type, cls], idx) => {
      const extra = idx === 0 ? 'autofocus' : '';
      if (type === 'num') return F.num(k, label, item[k], cls, extra);
      if (type === 'area') return F.area(k, label, item[k], cls);
      return F.text(k, label, item[k], cls, extra);
    }).join('')}</div>`,
    actions: [
      ...(i >= 0 ? [{ label: icon('trash'), cls: 'ghost', onClick: () => { c[list].splice(i, 1); commit(); } }, 'spacer'] : []),
      cancel,
      { label: 'Enregistrer', primary: true, onClick: (f) => {
        for (const [k, , type] of fields) item[k] = type === 'num' ? num(f[k].value) : f[k].value.trim();
        if (!item.name) item.name = title;
        if (i < 0) c[list].push(item);
        commit();
      } },
    ],
  });
}

// ================= Événements =================
$app.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  e.stopPropagation();
  A[el.dataset.act]?.(el, e);
});

// Champs liés : enregistrement à la frappe, rafraîchissement à la validation
$app.addEventListener('input', (e) => {
  const el = e.target;
  if (el.id === 'libSearch') { ui.libSearch = el.value; filterLib(el.value); return; }
  if (!el.dataset.bind) return;
  setPath(C(), el.dataset.bind, el.hasAttribute('data-num') ? num(el.value) : el.value);
  commit(false);
});
$app.addEventListener('change', (e) => {
  const el = e.target;
  // Carrière choisie dans le Carnet : la classe et le schéma (si présent en bibliothèque) suivent
  if (el.name === 'carnetCareer') {
    const c = C();
    if (el.value === '__other') { el.value = c.career.name && isKnownCareer(c.career.name) ? [...el.options].find((o) => R.norm(o.value) === R.norm(c.career.name))?.value : ''; A.editCareer(); return; }
    c.career.name = el.value;
    c.className = classForCareer(el.value);
    const tpl = store.findCareer(el.value);
    if (tpl) applyTemplate(c, tpl);
    commit();
    toast(tpl ? `Carrière ${tpl.name} : schéma chargé depuis la bibliothèque` : `Carrière : ${el.value || 'aucune'}`);
    return;
  }
  if (!el.dataset.bind) return;
  const c = C();
  setPath(c, el.dataset.bind, el.hasAttribute('data-num') ? num(el.value) : el.value);
  // Destin / Résilience changés dans le Carnet : la Chance et la Détermination actuelles suivent
  if (el.dataset.bind === 'fate.fate' || el.dataset.bind === 'fate.resilience') {
    const [cur, max] = el.dataset.bind === 'fate.fate' ? ['fortune', R.maxFortune(c)] : ['resolve', R.maxResolve(c)];
    c.fate[cur] = el.dataset.full === '1' ? max : Math.min(+c.fate[cur] || 0, max);
  }
  commit(el.hasAttribute('data-rerender') || el.hasAttribute('data-num'));
});
$app.addEventListener('submit', (e) => {
  const form = e.target;
  if (form.dataset.form !== 'quickItem') return;
  e.preventDefault();
  const name = form.item.value.trim();
  if (!name) return;
  C().items.push({ name, qty: 1, enc: 0, notes: '' });
  commit();
});

store.onStatus((st, info) => {
  const btn = document.getElementById('syncBtn');
  if (btn) { btn.className = `icon-btn sync-${st.state}`; btn.title = st.message; }
  const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
  if (info?.reloaded && !typing && !dlg.open) render();
});

render();
store.sync();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
