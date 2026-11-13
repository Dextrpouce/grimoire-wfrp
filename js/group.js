// Groupe partagé (caisse, dettes, matériel, ventes, quête, personnel) : copie locale + suivi en direct.
// Lecture possible hors ligne (dernière copie connue) ; les modifications demandent d'être connecté.
import * as cloud from './cloud.js';

const KEY = 'whfrp4.group';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } };
let cur = load();            // { id, name, members, state, updatedAt }
let stop = null;
let watching = null;
let error = '';
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn());
const save = () => { if (cur) localStorage.setItem(KEY, JSON.stringify(cur)); else localStorage.removeItem(KEY); };

export const EMPTY = () => ({ money: { co: 0, pa: 0, sc: 0 }, debts: [], items: [], sale: [], quest: [], staff: [], log: [] });
export const uid = () => Math.random().toString(36).slice(2, 10);

export const group = {
  get current() { return cur; },
  get state() { return { ...EMPTY(), ...(cur?.state || {}) }; },
  get error() { return error; },
  get online() { return !!cloud.user() && navigator.onLine; },
  onChange(fn) { listeners.add(fn); },

  // À appeler quand la connexion change : lance ou arrête le suivi en direct
  refresh() {
    const id = cur?.id;
    if (!id || !cloud.user()) { stop?.(); stop = null; watching = null; return; }
    if (watching === id) return;
    stop?.();
    watching = id;
    stop = cloud.watchGroup(id, (g) => { cur = g; error = ''; save(); emit(); }, (e) => { error = e.message || 'Erreur'; emit(); });
  },

  async create(name) {
    const id = Array.from({ length: 8 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
    await cloud.createGroup(id, name, EMPTY());
    cur = { id, name, members: {}, state: EMPTY(), updatedAt: Date.now() }; save(); this.refresh(); emit();
    return id;
  },
  async join(code) {
    const id = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const name = await cloud.joinGroup(id);
    cur = { id, name, members: {}, state: EMPTY(), updatedAt: 0 }; save(); this.refresh(); emit();
    return name;
  },
  async leave() {
    const id = cur?.id;
    stop?.(); stop = null; watching = null;
    cur = null; save(); emit();
    if (id) await cloud.leaveGroup(id).catch(() => {});
  },
  // fn(state) → texte du journal ; author = nom affiché dans le journal
  async update(fn, author) {
    if (!cur?.id) throw new Error('Aucun groupe');
    if (!this.online) throw new Error('Connecte-toi (nuage) pour modifier le groupe');
    return cloud.updateGroup(cur.id, (s) => {
      for (const [k, v] of Object.entries(EMPTY())) if (s[k] === undefined) s[k] = v;
      return fn(s);
    }, author);
  },
};
