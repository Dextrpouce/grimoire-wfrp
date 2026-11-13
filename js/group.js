// Groupe partagé (caisse, dettes, matériel, ventes, quête, personnel) : copie locale + file d'attente.
// Chaque modification est une « opération » (données simples) : appliquée tout de suite sur l'appareil,
// gardée en file d'attente (même si l'appli est fermée), puis envoyée dès que possible
// (retour du réseau, limite gratuite de Firebase réinitialisée…). Le journal est écrit à l'envoi.
import * as cloud from './cloud.js';

const KEY = 'whfrp4.group';
const QKEY = 'whfrp4.groupQueue';
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? d; } catch { return d; } };
let cur = read(KEY, null);          // { id, name, members, state (dernier état connu du serveur), updatedAt }
let queue = read(QKEY, []);         // [{ op, author, date }]
let stop = null;
let watching = null;
let error = '';                     // raison du blocage de la file (quota, hors ligne…)
let flushing = false;
let retryTimer = null;
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn());
const save = () => {
  if (cur) localStorage.setItem(KEY, JSON.stringify(cur)); else localStorage.removeItem(KEY);
  localStorage.setItem(QKEY, JSON.stringify(queue));
};

export const EMPTY = () => ({ money: { co: 0, pa: 0, sc: 0 }, debts: [], items: [], sale: [], quest: [], staff: [], log: [] });
export const uid = () => Math.random().toString(36).slice(2, 10);

// ---------- Argent ----------
const n = (v) => (v === '' || v == null || isNaN(+v) ? 0 : +v);
export const toSC = (m) => n(m?.co) * 240 + n(m?.pa) * 12 + n(m?.sc);
export const fromSC = (t) => ({ co: Math.floor(t / 240), pa: Math.floor((t % 240) / 12), sc: t % 12 });
export const fmtMoney = (m) => [[n(m?.co), 'CO'], [n(m?.pa), 'PA'], [n(m?.sc), 'SC']].filter(([v]) => v).map(([v, k]) => `${v} ${k}`).join(' ') || '0';
const addMoney = (a, b) => ({ co: n(a.co) + n(b.co), pa: n(a.pa) + n(b.pa), sc: n(a.sc) + n(b.sc) });
const fail = (msg) => { throw Object.assign(new Error(msg), { invalid: true }); };

// ---------- Opérations : appliquent une modification et renvoient le texte du journal ----------
const LISTS = { items: 'matériel', sale: 'ventes', quest: 'objets de quête', staff: 'personnel', debts: 'dettes' };
export function applyOp(s, op) {
  for (const [k, v] of Object.entries(EMPTY())) if (s[k] === undefined) s[k] = v;
  const find = (list, id) => s[list].find((x) => x.id === id) || fail('Élément introuvable (déjà supprimé ?)');
  switch (op.t) {
    case 'gain': s.money = addMoney(s.money, op.m); return `+${fmtMoney(op.m)} dans la caisse : ${op.note}`;
    case 'pay':
      if (toSC(op.m) > toSC(s.money)) fail('Pas assez dans la caisse');
      s.money = fromSC(toSC(s.money) - toSC(op.m)); return `−${fmtMoney(op.m)} payés : ${op.note}`;
    case 'debtAdd':
      if (op.out && toSC(op.debt.amount) > toSC(s.money)) fail('Pas assez dans la caisse pour cette avance');
      if (op.out) s.money = fromSC(toSC(s.money) - toSC(op.debt.amount));
      s.debts.push(op.debt);
      return `${op.debt.who} doit ${fmtMoney(op.debt.amount)} à la caisse${op.debt.note ? ` : ${op.debt.note}` : ''}${op.out ? ' (sorti de la caisse)' : ''}`;
    case 'repay': {
      const x = find('debts', op.id);
      const rest = toSC(x.amount) - Math.min(toSC(op.m), toSC(x.amount));
      s.money = addMoney(s.money, op.m);
      if (rest <= 0) s.debts = s.debts.filter((y) => y.id !== op.id); else x.amount = fromSC(rest);
      return `${x.who} rembourse ${fmtMoney(op.m)}${rest > 0 ? ` (reste ${fmtMoney(fromSC(rest))})` : ' : dette soldée'}`;
    }
    case 'add': s[op.list].push(op.item); return op.text;
    case 'edit': { const x = find(op.list, op.id); Object.assign(x, op.v); return op.text; }
    case 'del': { find(op.list, op.id); s[op.list] = s[op.list].filter((y) => y.id !== op.id); return op.text; }
    case 'qty': {
      const x = find('items', op.id);
      const before = n(x.qty); const after = Math.max(0, before + op.d);
      x.qty = after;
      if (op.removeAtZero && after <= 0) s.items = s.items.filter((y) => y.id !== op.id);
      return op.text || `${x.name} : ${before} → ${after}`;
    }
    case 'sold': {
      const x = find('sale', op.id);
      s.sale = s.sale.filter((y) => y.id !== op.id); s.money = addMoney(s.money, op.m);
      return `${x.name} vendu ${fmtMoney(op.m)}`;
    }
    case 'staffPay': {
      const x = find('staff', op.id);
      if (toSC(x.cost) > toSC(s.money)) fail('Pas assez dans la caisse');
      s.money = fromSC(toSC(s.money) - toSC(x.cost)); x.lastPaid = op.date;
      return `${x.name} payé : ${fmtMoney(x.cost)} (${x.period || 'mois'})`;
    }
    default: fail('Opération inconnue');
  }
  return '';
}

// État affiché = dernier état connu du serveur + opérations encore en attente
function viewState() {
  const s = JSON.parse(JSON.stringify({ ...EMPTY(), ...(cur?.state || {}) }));
  for (const q of queue) {
    try {
      const text = applyOp(s, q.op);
      s.log = [{ id: q.id, date: q.date, who: q.author, text, pending: true }, ...s.log];
    } catch { /* opération devenue impossible : elle sera écartée à l'envoi */ }
  }
  return s;
}

const errText = (e) => (e.code === 'resource-exhausted' ? 'Limite gratuite de Firebase atteinte pour aujourd’hui'
  : e.code === 'permission-denied' ? 'Accès refusé par le groupe'
  : e.code === 'unavailable' || !navigator.onLine ? 'Hors ligne'
  : e.auth ? 'Non connecté (touche le nuage)'
  : e.message || 'Erreur');

export const group = {
  get current() { return cur; },
  get state() { return viewState(); },
  get pending() { return queue.length; },
  get error() { return error || (!navigator.onLine ? 'Hors ligne' : !cloud.user() ? 'Connexion au nuage en attente' : ''); },
  get online() { return !!cloud.user() && navigator.onLine; },
  onChange(fn) { listeners.add(fn); },

  // À appeler quand la connexion change : lance le suivi en direct et envoie la file
  refresh() {
    const id = cur?.id;
    if (!id || !cloud.user()) { stop?.(); stop = null; watching = null; return; }
    if (watching !== id) {
      stop?.();
      watching = id;
      stop = cloud.watchGroup(id, (g) => { cur = g; save(); emit(); }, (e) => { error = errText(e); emit(); });
    }
    this.flush();
  },

  async create(name) {
    const id = Array.from({ length: 8 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
    await cloud.createGroup(id, name, EMPTY());
    cur = { id, name, members: {}, state: EMPTY(), updatedAt: Date.now() }; queue = []; save(); this.refresh(); emit();
    return id;
  },
  async join(code) {
    const id = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const name = await cloud.joinGroup(id);
    cur = { id, name, members: {}, state: EMPTY(), updatedAt: 0 }; queue = []; save(); this.refresh(); emit();
    return name;
  },
  async leave() {
    const id = cur?.id;
    stop?.(); stop = null; watching = null;
    cur = null; queue = []; save(); emit();
    if (id) await cloud.leaveGroup(id).catch(() => {});
  },

  // Applique une opération tout de suite (sur l'appareil) et la met en file d'attente.
  // Lève une erreur si elle est impossible (ex. pas assez dans la caisse).
  apply(op, author) {
    if (!cur?.id) throw new Error('Aucun groupe');
    applyOp(viewState(), op); // vérifie qu'elle est possible
    queue.push({ id: uid(), op, author, date: Date.now() });
    save(); emit();
    this.flush();
  },

  // Envoie les opérations en attente, une par une, dans l'ordre
  async flush() {
    if (flushing || !queue.length || !cur?.id) return;
    if (!this.online) { error = !navigator.onLine ? 'Hors ligne' : 'Connexion au nuage en attente'; emit(); return; }
    flushing = true;
    clearTimeout(retryTimer);
    let dropped = 0;
    try {
      while (queue.length) {
        const q = queue[0];
        try {
          await cloud.updateGroup(cur.id, (s) => applyOp(s, q.op), q.author, q.date);
        } catch (e) {
          if (e.invalid) { dropped++; } else throw e; // devenue impossible (ex. supprimée entre-temps) : écartée
        }
        queue.shift(); save();
      }
      error = '';
    } catch (e) {
      error = errText(e);
      retryTimer = setTimeout(() => this.flush(), e.code === 'resource-exhausted' ? 15 * 60e3 : 60e3);
    } finally {
      flushing = false;
      if (dropped) error = `${dropped} modification(s) écartée(s) : devenues impossibles (déjà faites par un autre joueur ?)`;
      emit();
    }
  },
};

window.addEventListener('online', () => group.flush());
