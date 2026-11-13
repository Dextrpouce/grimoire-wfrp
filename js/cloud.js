// Sauvegarde en ligne via Firebase (offre gratuite « Spark », sans carte bancaire).
// Chaque personnage est un document : users/{uid}/characters/{id}
// La connexion Google reste active d'une session à l'autre : la synchro est automatique.
const SDK = 'https://www.gstatic.com/firebasejs/10.14.1';

let fb = null;       // modules Firebase chargés
let app = null;
let auth = null;
let db = null;
let readyPromise = null;

export function isConfigured(config) {
  return !!(config && config.apiKey && config.projectId);
}

// Charge Firebase et attend de savoir si l'utilisateur est déjà connecté
export function init(config) {
  if (readyPromise) return readyPromise;
  readyPromise = (async () => {
    const [appMod, authMod, fsMod] = await Promise.all([
      import(`${SDK}/firebase-app.js`),
      import(`${SDK}/firebase-auth.js`),
      import(`${SDK}/firebase-firestore.js`),
    ]);
    fb = { ...appMod, ...authMod, ...fsMod };
    app = fb.initializeApp(config);
    auth = fb.getAuth(app);
    db = fb.getFirestore(app);
    await new Promise((resolve) => { const off = fb.onAuthStateChanged(auth, () => { off(); resolve(); }); });
  })().catch((e) => { readyPromise = null; throw e; });
  return readyPromise;
}

export const user = () => auth?.currentUser || null;

export function onUserChange(fn) {
  if (auth) fb.onAuthStateChanged(auth, fn);
}

// Doit suivre un geste de l'utilisateur (ouvre la fenêtre Google)
export async function signIn() {
  const provider = new fb.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  await fb.signInWithPopup(auth, provider);
}

export async function signOut() {
  if (auth) await fb.signOut(auth);
}

function col() {
  const u = user();
  if (!u) throw Object.assign(new Error('Non connecté'), { auth: true });
  return fb.collection(db, 'users', u.uid, 'characters');
}

// Récupère tout ce qui est en ligne : { characters: {id: perso}, deleted: {id: date} }
export async function pull() {
  const snap = await fb.getDocs(col());
  const characters = {};
  const deleted = {};
  snap.forEach((d) => {
    const v = d.data();
    if (v.deleted) deleted[d.id] = v.updatedAt || 0;
    else if (v.json) characters[d.id] = JSON.parse(v.json);
  });
  return { characters, deleted };
}

// ----- Bibliothèques partagées : careers/{id} et talents/{id} -----
// Lisibles par tout joueur connecté, modifiables seulement par leur auteur.
export async function pullLib(col) {
  const snap = await fb.getDocs(fb.collection(db, col));
  const out = {};
  snap.forEach((d) => { out[d.id] = { ...d.data(), id: d.id }; });
  return out;
}

export async function saveLib(col, tpl) {
  const u = user();
  const data = { ...tpl, authorUid: u.uid, authorName: u.displayName || u.email || '' };
  delete data.dirty; delete data.id;
  await fb.setDoc(fb.doc(db, col, tpl.id), data);
  return data;
}

export async function deleteLib(col, id) {
  await fb.deleteDoc(fb.doc(db, col, id));
}

// ----- Groupe partagé : groups/{code} -----
// Un document par groupe : membres + état (caisse, dettes, matériel…) en JSON + journal.
// Toute modification passe par une transaction : deux joueurs peuvent écrire en même temps sans rien perdre.
const groupDoc = (id) => fb.doc(db, 'groups', id);
const who = () => { const u = user(); if (!u) throw Object.assign(new Error('Non connecté'), { auth: true }); return u; };

export async function createGroup(id, name, state) {
  const u = who();
  await fb.setDoc(groupDoc(id), {
    name, members: [u.uid], memberNames: { [u.uid]: u.displayName || u.email || 'Joueur' },
    json: JSON.stringify(state), updatedAt: Date.now(), createdAt: Date.now(),
  });
}

// Rejoindre : on s'ajoute seulement à la liste des membres
export async function joinGroup(id) {
  const u = who();
  return fb.runTransaction(db, async (tx) => {
    const snap = await tx.get(groupDoc(id));
    if (!snap.exists()) throw new Error('Code de groupe inconnu');
    const d = snap.data();
    if (!d.members.includes(u.uid)) {
      tx.update(groupDoc(id), { members: [...d.members, u.uid], memberNames: { ...d.memberNames, [u.uid]: u.displayName || u.email || 'Joueur' } });
    }
    return d.name;
  });
}

// fn(state) modifie l'état et renvoie le texte du journal (ou null pour annuler)
// date = moment réel de la modification (elle a pu attendre hors ligne avant d'être envoyée)
export async function updateGroup(id, fn, author, date = Date.now()) {
  who();
  return fb.runTransaction(db, async (tx) => {
    const snap = await tx.get(groupDoc(id));
    if (!snap.exists()) throw new Error('Groupe introuvable');
    const state = JSON.parse(snap.data().json || '{}');
    const text = fn(state);
    if (!text) return false;
    state.log = [{ id: Math.random().toString(36).slice(2, 10), date, who: author, text }, ...(state.log || [])].sort((a, b) => b.date - a.date).slice(0, 400);
    tx.update(groupDoc(id), { json: JSON.stringify(state), updatedAt: Date.now() });
    return true;
  });
}

// Suit le groupe en direct ; renvoie la fonction pour arrêter
export function watchGroup(id, onData, onError) {
  return fb.onSnapshot(groupDoc(id), (snap) => {
    if (!snap.exists()) { onError?.(new Error('Groupe introuvable')); return; }
    const d = snap.data();
    onData({ id, name: d.name, members: d.memberNames || {}, state: JSON.parse(d.json || '{}'), updatedAt: d.updatedAt || 0 });
  }, (e) => onError?.(e));
}

export async function leaveGroup(id) {
  const u = who();
  await fb.runTransaction(db, async (tx) => {
    const snap = await tx.get(groupDoc(id));
    if (!snap.exists()) return;
    const d = snap.data();
    const names = { ...d.memberNames }; delete names[u.uid];
    tx.update(groupDoc(id), { members: d.members.filter((m) => m !== u.uid), memberNames: names });
  });
}

// Envoie les personnages modifiés depuis la dernière synchro
export async function push(characters, deleted, since) {
  const c = col();
  const batch = fb.writeBatch(db);
  let n = 0;
  for (const ch of Object.values(characters)) {
    if ((ch.updatedAt || 0) <= since) continue;
    batch.set(fb.doc(c, ch.id), { json: JSON.stringify(ch), name: ch.name, updatedAt: ch.updatedAt || Date.now(), deleted: false });
    n++;
  }
  for (const [id, ts] of Object.entries(deleted)) {
    if (ts <= since) continue;
    batch.set(fb.doc(c, id), { deleted: true, updatedAt: ts });
    n++;
  }
  if (n) await batch.commit();
  return n;
}
