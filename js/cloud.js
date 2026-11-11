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

// ----- Bibliothèque de carrières partagée : careers/{id} -----
// Lisible par tout joueur connecté, modifiable seulement par son auteur.
export async function pullCareers() {
  const snap = await fb.getDocs(fb.collection(db, 'careers'));
  const out = {};
  snap.forEach((d) => { out[d.id] = { ...d.data(), id: d.id }; });
  return out;
}

export async function saveCareer(tpl) {
  const u = user();
  const data = { ...tpl, authorUid: u.uid, authorName: u.displayName || u.email || '' };
  delete data.dirty; delete data.id;
  await fb.setDoc(fb.doc(db, 'careers', tpl.id), data);
  return data;
}

export async function deleteCareer(id) {
  await fb.deleteDoc(fb.doc(db, 'careers', id));
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
