// Données : toujours enregistrées sur l'appareil d'abord, puis envoyées en ligne dès que possible.
import * as cloud from './cloud.js';
import { upgradeCharacter } from './rules.js';
import { FIREBASE_CONFIG } from './config.js';

const DATA_KEY = 'whfrp4.data';
const META_KEY = 'whfrp4.meta';

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

const LIB_KEY = 'whfrp4.careers';
const data = load(DATA_KEY, { characters: {}, deleted: {} });
// Bibliothèques partagées : carrières et talents ({id: modèle}) + identifiants supprimés à envoyer
const lib = load(LIB_KEY, { careers: {}, removed: [] });
lib.talents ??= {};
lib.removedTalents ??= [];
lib.spells ??= {};
lib.removedSpells ??= [];
const LIBS = {
  careers: { items: 'careers', removed: 'removed' },
  talents: { items: 'talents', removed: 'removedTalents' },
  spells: { items: 'spells', removed: 'removedSpells' },
};
const libUid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const normName = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
const persistLib = () => localStorage.setItem(LIB_KEY, JSON.stringify(lib));
const meta = load(META_KEY, { currentId: null, firebase: null, dirty: false, lastSync: 0, lastPush: 0 });
// Anciens personnages provisoires jamais modifiés (créés automatiquement) : on les retire
{
  const stale = Object.values(data.characters).filter((c) => !c.updatedAt);
  stale.forEach((c) => delete data.characters[c.id]);
  if (stale.length) { if (stale.some((c) => c.id === meta.currentId)) meta.currentId = null; persist(); }
}
Object.values(data.characters).forEach(upgradeCharacter);

let syncTimer = null;
let syncing = false;
let again = false;
const listeners = new Set();
let status = { state: 'idle', message: '' };

function persist() {
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

function setStatus(state, message = '', info) {
  status = { state, message };
  listeners.forEach((fn) => fn(status, info));
}

const config = () => meta.firebase || (cloud.isConfigured(FIREBASE_CONFIG) ? FIREBASE_CONFIG : null);

export const store = {
  onStatus(fn) { listeners.add(fn); },
  get status() { return status; },
  get meta() { return meta; },
  get configured() { return !!config(); },
  get userEmail() { return cloud.user()?.email || ''; },
  setFirebaseConfig(text) {
    if (!text.trim()) { meta.firebase = null; persist(); return true; }
    // Accepte le bloc copié depuis la console Firebase (const firebaseConfig = {...})
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('Configuration introuvable');
    const json = m[0]
      .replace(/^\s*\/\/.*$/gm, '')
      .replace(/'/g, '"')
      .replace(/([{,]\s*)([A-Za-z_]\w*)\s*:/g, '$1"$2":')
      .replace(/,\s*}/g, '}');
    const obj = JSON.parse(json);
    if (!cloud.isConfigured(obj)) throw new Error('apiKey ou projectId manquant');
    meta.firebase = obj; persist();
    return true;
  },

  list() {
    return Object.values(data.characters).sort((a, b) => a.name.localeCompare(b.name));
  },
  // Personnage affiché ; null s'il n'y en a aucun (l'appli propose alors d'en créer un)
  current() {
    let c = data.characters[meta.currentId];
    if (!c) {
      c = this.list()[0] || null;
      if (c) { meta.currentId = c.id; persist(); }
    }
    return c;
  },
  select(id) { meta.currentId = id; persist(); },
  add(c) { data.characters[c.id] = c; meta.currentId = c.id; markDirty(); },
  remove(id) {
    delete data.characters[id];
    data.deleted[id] = Date.now();
    if (meta.currentId === id) meta.currentId = null;
    markDirty();
  },
  save() { markDirty(); },

  // ----- Bibliothèque de carrières -----
  get userUid() { return cloud.user()?.uid || ''; },
  careers() { return Object.values(lib.careers).sort((a, b) => a.name.localeCompare(b.name, 'fr')); },
  findCareer(name) {
    const n = (name || '').trim().toLowerCase();
    const all = this.careers().filter((t) => t.name.trim().toLowerCase() === n);
    return all.find((t) => !t.authorUid || t.authorUid === this.userUid) || all[0] || null;
  },
  canEditCareer(t) { return !t.authorUid || t.authorUid === this.userUid; },
  saveCareer(tpl) { return libSave('careers', tpl); },
  removeCareer(id) { return libRemove('careers', id); },

  // ----- Bibliothèque de talents -----
  talents() { return Object.values(lib.talents).sort((a, b) => a.name.localeCompare(b.name, 'fr')); },
  // Trouve un talent par son nom, un alias (nom anglais…) ou avec une précision entre parenthèses
  findTalent(name) {
    const full = normName(name);
    const base = normName((name || '').replace(/\s*\(.*\)\s*$/, ''));
    const hit = (t) => [t.name, ...(t.aliases || [])].map(normName).some((n) => n === full || n === base);
    const all = this.talents().filter(hit);
    return all.find((t) => this.canEditCareer(t)) || all[0] || null;
  },
  saveTalent(tpl) { return libSave('talents', tpl); },
  removeTalent(id) { return libRemove('talents', id); },

  // ----- Bibliothèque de sorts -----
  spells() { return Object.values(lib.spells).sort((a, b) => a.name.localeCompare(b.name, 'fr')); },
  findSpell(name) {
    const n = normName(name);
    const all = this.spells().filter((t) => normName(t.name) === n);
    return all.find((t) => this.canEditCareer(t)) || all[0] || null;
  },
  saveSpell(tpl) { return libSave('spells', tpl); },
  removeSpell(id) { return libRemove('spells', id); },
  exportAll() { return JSON.stringify({ format: 'whfrp4', version: 1, ...data }, null, 2); },
  importAll(json) {
    const incoming = JSON.parse(json);
    // Fichier de carrières : { format: 'whfrp4-careers', careers: [...] }
    if (incoming.format === 'whfrp4-careers') {
      let n = 0;
      // « replace » : retire d'abord tes propres carrières absentes du fichier
      if (incoming.replace) {
        const keep = new Set((incoming.careers || []).map((t) => normName(t.name)));
        for (const t of this.careers()) if (this.canEditCareer(t) && !keep.has(normName(t.name))) this.removeCareer(t.id);
      }
      for (const t of incoming.careers || []) {
        if (!t?.name || !Array.isArray(t.levels)) continue;
        const existing = this.findCareer(t.name);
        const levels = [0, 1, 2, 3].map((i) => {
          const l = t.levels[i] || {};
          return { title: l.title || '', status: l.status || '', chars: l.chars || [], skills: l.skills || [], talents: l.talents || [] };
        });
        this.saveCareer({ id: existing && this.canEditCareer(existing) ? existing.id : null, name: t.name, className: t.className || '', path: t.path || '', levels });
        n++;
      }
      return { careers: n };
    }
    // Fichier de talents : { format: 'whfrp4-talents', talents: [...] }
    if (incoming.format === 'whfrp4-talents') {
      let n = 0;
      // « replace » : retire d'abord tes propres talents absents du fichier (évite les doublons d'anciennes listes)
      if (incoming.replace) {
        const keep = new Set((incoming.talents || []).map((t) => normName(t.name)));
        for (const t of this.talents()) {
          if (this.canEditCareer(t) && !keep.has(normName(t.name))) this.removeTalent(t.id);
        }
      }
      for (const t of incoming.talents || []) {
        if (!t?.name) continue;
        const existing = this.findTalent(t.name);
        this.saveTalent({
          id: existing && this.canEditCareer(existing) ? existing.id : null,
          name: t.name, aliases: t.aliases || [], max: t.max || '', tests: t.tests || '', sl: !!t.sl, desc: t.desc || '',
        });
        n++;
      }
      return { talents: n };
    }
    // Fichier de sorts : { format: 'whfrp4-spells', replace?, spells: [...] }
    if (incoming.format === 'whfrp4-spells') {
      let n = 0;
      if (incoming.replace) {
        const keep = new Set((incoming.spells || []).map((t) => normName(t.name)));
        for (const t of this.spells()) if (this.canEditCareer(t) && !keep.has(normName(t.name))) this.removeSpell(t.id);
      }
      for (const t of incoming.spells || []) {
        if (!t?.name) continue;
        const existing = this.findSpell(t.name);
        this.saveSpell({
          id: existing && this.canEditCareer(existing) ? existing.id : null,
          name: t.name, lore: t.lore || '', cn: String(t.cn ?? ''), range: t.range || '', target: t.target || '', duration: t.duration || '', desc: t.desc || '',
        });
        n++;
      }
      return { spells: n };
    }
    const chars = incoming.characters ? Object.values(incoming.characters) : [incoming];
    let n = 0;
    for (const c of chars) {
      if (!c?.id || !c.chars) continue;
      upgradeCharacter(c);
      c.updatedAt = Date.now();
      data.characters[c.id] = c;
      delete data.deleted[c.id];
      n++;
    }
    markDirty();
    return n;
  },

  // ----- Synchronisation -----
  async sync({ interactive = false } = {}) {
    if (syncing) { again = true; return; }
    const cfg = config();
    if (!cfg) return setStatus('nocloud', 'Sauvegarde en ligne non configurée');
    if (!navigator.onLine) return setStatus(meta.dirty ? 'offline' : 'synced', meta.dirty ? 'Hors ligne — envoi dès le retour du réseau' : 'Hors ligne');
    syncing = true;
    try {
      await cloud.init(cfg);
      if (!cloud.user()) {
        if (!interactive) { setStatus('needauth', 'Touchez le nuage pour vous connecter'); return; }
        setStatus('syncing', 'Connexion…');
        await cloud.signIn();
      }
      setStatus('syncing', 'Synchronisation…');
      const start = Date.now();
      const remote = await cloud.pull();
      const changed = merge(remote);
      await cloud.push(data.characters, data.deleted, meta.lastPush);
      meta.lastPush = start;
      meta.lastSync = Date.now();
      meta.dirty = Object.values(data.characters).some((c) => (c.updatedAt || 0) > start);
      persist();
      await syncLib('careers');
      await syncLib('talents');
      await syncLib('spells');
      setStatus(meta.dirty ? 'pending' : 'synced', `Synchronisé (${cloud.user().email})`, { reloaded: changed });
    } catch (e) {
      const msg = e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request' ? 'Connexion annulée'
        : e.code === 'auth/popup-blocked' ? 'Fenêtre Google bloquée : touche à nouveau le nuage'
        : e.code === 'auth/api-key-not-valid' || e.code?.startsWith('auth/invalid-api-key') ? 'Configuration Firebase invalide (apiKey)'
        : e.code === 'auth/unauthorized-domain' ? 'Domaine non autorisé dans Firebase (voir README)'
        : e.code === 'permission-denied' ? 'Accès refusé : vérifie les règles Firestore (voir README)'
        : e.auth ? 'Touchez le nuage pour vous connecter' : (e.message || 'Erreur de synchronisation');
      setStatus(e.auth ? 'needauth' : 'error', msg);
    } finally {
      syncing = false;
      if (again) { again = false; scheduleSync(); }
    }
  },
  async disconnect() {
    await cloud.signOut();
    meta.lastPush = 0; persist();
    setStatus('needauth', 'Déconnecté');
  },
};

function libSave(kind, tpl) {
  const items = lib[LIBS[kind].items];
  const existing = tpl.id && items[tpl.id];
  if (existing && !store.canEditCareer(existing)) tpl.id = null; // copie personnelle d'un modèle d'un autre joueur
  tpl.id ||= libUid();
  items[tpl.id] = { ...existing, ...tpl, updatedAt: Date.now(), dirty: true };
  persistLib();
  scheduleSync();
  return items[tpl.id];
}

function libRemove(kind, id) {
  const { items, removed } = LIBS[kind];
  const t = lib[items][id];
  if (!t || !store.canEditCareer(t)) return false;
  delete lib[items][id];
  if (t.authorUid) lib[removed].push(id);
  persistLib();
  scheduleSync();
  return true;
}

// Les bibliothèques ne bloquent jamais la synchro des personnages : une erreur ici est ignorée
async function syncLib(kind) {
  const { items, removed } = LIBS[kind];
  try {
    for (const id of [...lib[removed]]) {
      await cloud.deleteLib(kind, id);
      lib[removed] = lib[removed].filter((x) => x !== id);
    }
    for (const t of Object.values(lib[items])) {
      if (!t.dirty) continue;
      const saved = await cloud.saveLib(kind, t);
      lib[items][t.id] = { ...saved, id: t.id };
    }
    const remote = await cloud.pullLib(kind);
    for (const [id, t] of Object.entries(remote)) {
      const local = lib[items][id];
      if (!local || (!local.dirty && (t.updatedAt || 0) >= (local.updatedAt || 0))) lib[items][id] = t;
    }
    // Retire les modèles supprimés par leur auteur
    for (const [id, t] of Object.entries(lib[items])) {
      if (t.authorUid && !t.dirty && !remote[id]) delete lib[items][id];
    }
    // Fusionne les doublons d'un même auteur (même nom) : garde la version la plus récente
    const groups = {};
    for (const t of Object.values(lib[items])) {
      if (t.authorUid && t.authorUid === store.userUid) (groups[normName(t.name)] ||= []).push(t);
    }
    for (const g of Object.values(groups)) {
      if (g.length < 2) continue;
      g.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      for (const t of g.slice(1)) {
        delete lib[items][t.id];
        await cloud.deleteLib(kind, t.id);
      }
    }
    persistLib();
  } catch (e) {
    console.warn(`Bibliothèque « ${kind} » non synchronisée :`, e.message);
  }
}

function markDirty() {
  meta.dirty = true;
  persist();
  if (['synced', 'idle'].includes(status.state)) setStatus('pending', 'Modifications à envoyer');
  scheduleSync();
}

function scheduleSync() {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => store.sync(), 2000);
}

// Fusion : pour chaque personnage, la version modifiée le plus récemment gagne
function merge(remote) {
  let changed = false;
  const rc = remote.characters || {};
  if (Object.keys(rc).length) {
    // Supprime le personnage provisoire jamais modifié d'un nouvel appareil
    for (const [id, c] of Object.entries(data.characters)) {
      if (!c.updatedAt && !rc[id]) { delete data.characters[id]; changed = true; }
    }
  }
  for (const [id, ts] of Object.entries(remote.deleted || {})) {
    data.deleted[id] = Math.max(data.deleted[id] || 0, ts);
  }
  for (const [id, c] of Object.entries(rc)) {
    const local = data.characters[id];
    if (!local || (c.updatedAt || 0) > (local.updatedAt || 0)) { data.characters[id] = upgradeCharacter(c); changed = true; }
  }
  for (const [id, ts] of Object.entries(data.deleted)) {
    const c = data.characters[id];
    if (c && (c.updatedAt || 0) <= ts) { delete data.characters[id]; changed = true; }
    else if (c) delete data.deleted[id];
  }
  persist();
  return changed;
}

window.addEventListener('online', () => store.sync());
window.addEventListener('offline', () => setStatus(meta.dirty ? 'offline' : 'synced', 'Hors ligne'));
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') store.sync(); });
setInterval(() => { if (meta.dirty) store.sync(); }, 60_000);
