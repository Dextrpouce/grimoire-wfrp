// Règles Warhammer Fantasy Roleplay 4e édition (VF)

export const CHARS = [
  { key: 'CC', name: 'Capacité de Combat' },
  { key: 'CT', name: 'Capacité de Tir' },
  { key: 'F', name: 'Force' },
  { key: 'E', name: 'Endurance' },
  { key: 'I', name: 'Initiative' },
  { key: 'Ag', name: 'Agilité' },
  { key: 'Dex', name: 'Dextérité' },
  { key: 'Int', name: 'Intelligence' },
  { key: 'FM', name: 'Force Mentale' },
  { key: 'Soc', name: 'Sociabilité' },
];

export const BASIC_SKILLS = [
  ['Art', 'Dex'], ['Athlétisme', 'Ag'], ['Calme', 'FM'], ['Charme', 'Soc'],
  ['Chevaucher', 'Ag'], ['Commandement', 'Soc'], ["Conduite d'attelage", 'Ag'],
  ['Corps à corps (base)', 'CC'], ['Discrétion', 'Ag'], ['Divertissement', 'Soc'],
  ['Emprise animaux', 'FM'], ['Escalade', 'F'], ['Esquive', 'Ag'], ['Intimidation', 'F'],
  ['Intuition', 'I'], ['Marchandage', 'Soc'], ['Navigation', 'I'], ['Pari', 'Int'],
  ['Perception', 'I'], ['Ragot', 'Soc'], ['Ramer', 'F'], ['Résistance', 'E'],
  ["Résistance à l'alcool", 'E'], ['Subornation', 'Soc'], ['Survie en extérieur', 'Int'],
];

// Compétences proposées à l'ajout (groupées ou avancées)
export const OTHER_SKILLS = [
  ['Corps à corps', 'CC'], ['Projectiles', 'CT'], ['Crochetage', 'Dex'], ['Dressage', 'Int'],
  ['Escamotage', 'Dex'], ['Évaluation', 'Int'], ['Focalisation', 'FM'], ['Guérison', 'Int'],
  ['Langue', 'Int'], ['Métier', 'Dex'], ['Musicien', 'Dex'], ['Natation', 'F'],
  ['Pistage', 'I'], ['Pose de pièges', 'Dex'], ['Prière', 'Soc'], ['Recherche', 'Int'],
  ['Représentation', 'Ag'], ['Savoir', 'Int'], ['Signes secrets', 'Int'],
  ['Soins aux animaux', 'Int'], ['Voile', 'Ag'],
];

// Les 8 classes et leurs carrières (noms traduits de la VO : suggestions, le nom reste modifiable)
export const CLASSES = {
  'Érudits': ['Apothicaire', 'Ingénieur', 'Avocat', 'Nonne', 'Médecin', 'Prêtre', 'Érudit', 'Sorcier'],
  'Bourgeois': ['Agitateur', 'Artisan', 'Mendiant', 'Enquêteur', 'Marchand', 'Ratier', 'Citadin', 'Garde'],
  'Courtisans': ['Conseiller', 'Artiste', 'Duelliste', 'Émissaire', 'Noble', 'Serviteur', 'Espion', 'Intendant'],
  'Paysans': ['Bailli', 'Sorcière de village', 'Herboriste', 'Chasseur', 'Mineur', 'Mystique', 'Éclaireur', 'Villageois'],
  'Itinérants': ['Chasseur de primes', 'Cocher', 'Saltimbanque', 'Flagellant', 'Messager', 'Colporteur', 'Patrouilleur routier', 'Répurgateur'],
  'Riverains': ['Batelier', 'Pilote fluvial', 'Patrouilleur fluvial', 'Riverain', 'Marin', 'Contrebandier', 'Débardeur', 'Naufrageur'],
  'Roublards': ['Entremetteur', 'Charlatan', 'Receleur', 'Pilleur de tombes', 'Hors-la-loi', 'Racketteur', 'Voleur', 'Sorcier sauvage'],
  'Guerriers': ['Cavalier', 'Garde du corps', 'Chevalier', 'Gladiateur', 'Spadassin', 'Soldat', 'Tueur', 'Prêtre guerrier'],
};

export function classOfCareer(name) {
  const n = norm(name);
  return Object.keys(CLASSES).find((k) => CLASSES[k].some((x) => norm(x) === n)) || '';
}

export const SPECIES = {
  'Humain': { move: 4, sb: true },
  'Nain': { move: 3, sb: true },
  'Halfling': { move: 3, sb: false },
  'Haut Elfe': { move: 5, sb: true },
  'Elfe Sylvain': { move: 5, sb: true },
  'Gnome': { move: 3, sb: false },
  'Ogre': { move: 6, sb: true },
};

export const CONDITIONS = [
  { name: 'À terre', stack: false }, { name: 'Assourdi', stack: true },
  { name: 'Aveuglé', stack: true }, { name: 'Brisé', stack: true },
  { name: 'Empêtré', stack: true }, { name: 'Empoisonné', stack: true },
  { name: 'En flammes', stack: true }, { name: 'Épuisé', stack: true },
  { name: 'Hémorragique', stack: true }, { name: 'Inconscient', stack: false },
  { name: 'Sonné', stack: true }, { name: 'Surpris', stack: false },
];

export const LOCATIONS = [
  { key: 'tete', name: 'Tête', range: '01-09' },
  { key: 'brasG', name: 'Bras gauche', range: '10-24' },
  { key: 'brasD', name: 'Bras droit', range: '25-44' },
  { key: 'corps', name: 'Corps', range: '45-79' },
  { key: 'jambeG', name: 'Jambe gauche', range: '80-89' },
  { key: 'jambeD', name: 'Jambe droite', range: '90-00' },
];

// Coût d'UNE augmentation, selon le nombre d'augmentations déjà prises
const CHAR_COST = [25, 30, 40, 50, 70, 90, 120, 150, 190, 230, 280, 330, 390, 450, 520];
const SKILL_COST = [10, 15, 20, 30, 40, 60, 80, 110, 140, 180, 220, 270, 320, 380, 440];

export function advanceCost(type, current, inCareer = true) {
  const table = type === 'char' ? CHAR_COST : SKILL_COST;
  const base = table[Math.min(Math.floor(current / 5), table.length - 1)];
  return inCareer ? base : base * 2;
}

export function talentCost(timesTaken, inCareer = true) {
  const base = 100 * (timesTaken + 1);
  return inCareer ? base : base * 2;
}

export const LEVEL_UP_COST = 100;
export function careerChangeCost(levelCompleted) { return levelCompleted ? 100 : 200; }

// ---------- Valeurs dérivées ----------
export const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

// Talents qui donnent +5 permanent à une caractéristique (hors augmentations achetées)
export const CHAR_TALENTS = {
  CC: ['Guerrier-Né', 'Warrior Born'], CT: ['Bon Tireur', 'Marksman'], F: ['Très Fort', 'Very Strong'],
  E: ['Très Résistant', 'Very Resilient'], I: ["Vif d'Esprit", 'Sharp'], Ag: ['Réflexes Éclairs', 'Lightning Reflexes'],
  Dex: ['Doigt Agile', 'Doigts Agiles', 'Nimble Fingered'], Int: ['Intelligent', 'Savvy'],
  FM: ["Calme d'Esprit", 'Coolheaded'], Soc: ['Charmant', 'Suave'],
};

// Bonus de talent d'une caractéristique : { value, names } (ex. { value: 5, names: ['Très Fort'] })
export function talentCharBonus(c, key) {
  const names = [];
  let value = 0;
  for (const n of CHAR_TALENTS[key] || []) {
    const t = c.talents?.find((x) => norm(x.name) === norm(n));
    if (t && +t.times > 0) { value += 5 * (+t.times || 1); names.push(t.name); }
  }
  return { value, names };
}

export function charValue(c, key) {
  const ch = c.chars[key];
  return (+ch.initial || 0) + (+ch.advances || 0) + (+ch.modifier || 0) + talentCharBonus(c, key).value;
}
export const bonus = (v) => Math.floor(v / 10);
export const charBonus = (c, key) => bonus(charValue(c, key));

export function skillLabel(s) { return s.spec ? `${s.name} (${s.spec})` : s.name; }
export function skillValue(c, s) { return charValue(c, s.char) + (+s.advances || 0); }

export function talentTimes(c, name) {
  const t = c.talents.find((t) => norm(t.name) === norm(name));
  return t ? +t.times || 0 : 0;
}

const HARDY_NAMES = ['Dur à cuire', 'Hardy', 'Inflexible', 'Robuste'];

// Maximum d'un talent : « 2 », « Bonus de I », « Bonus de Force Mentale », « Bonus Sociabilite »…
// (null = pas de limite connue). L'ordre compte : « force mentale » avant « force ».
const MAX_WORDS = [
  [/force\s+mentale|\bfm\b|\bwp\b/, 'FM'], [/capacite\s+(de\s+)?combat|\bcc\b|\bws\b/, 'CC'],
  [/capacite\s+(de\s+)?tir|\bct\b|\bbs\b/, 'CT'], [/sociabilite|\bsoc\b|\bfel\b/, 'Soc'],
  [/intelligence|\bint\b/, 'Int'], [/dexterite|\bdex\b|\bdxt\b/, 'Dex'], [/agilite|\bag\b/, 'Ag'],
  [/endurance|\be\b|\bt\b/, 'E'], [/initiative|instinct|\bi\b/, 'I'], [/force|\bf\b|\bs\b/, 'F'],
];
export function maxChar(spec) {
  const s = norm(spec);
  if (!s.startsWith('bonus')) return null;
  const rest = s.replace(/^bonus\s*(de\s+|d'\s*|d\s+)?/, '');
  return MAX_WORDS.find(([re]) => re.test(rest))?.[1] || null;
}
export function talentMax(c, spec) {
  const s = String(spec ?? '').trim();
  if (!s) return null;
  if (/^\d+$/.test(s)) return +s;
  const k = maxChar(s);
  return k ? Math.max(1, charBonus(c, k)) : null;
}

export function woundsBreakdown(c) {
  const sp = SPECIES[c.species] || SPECIES['Humain'];
  const sb = sp.sb ? charBonus(c, 'F') : 0;
  const tb2 = charBonus(c, 'E') * 2;
  const wpb = charBonus(c, 'FM');
  const hardy = HARDY_NAMES.reduce((n, name) => n + talentTimes(c, name), 0) * charBonus(c, 'E');
  const extra = +c.health.woundsExtra || 0;
  return { sb, tb2, wpb, hardy, extra, total: sb + tb2 + wpb + hardy + extra };
}
export const maxWounds = (c) => woundsBreakdown(c).total;

const timesAny = (c, names) => names.reduce((n, name) => n + talentTimes(c, name), 0);

export function movement(c) {
  const species = c.moveOverride != null && c.moveOverride !== '' ? +c.moveOverride : (SPECIES[c.species]?.move ?? 4);
  const fleet = timesAny(c, ['Pieds Légers', 'Fleet Footed']);
  const base = species + fleet;
  return { move: base, walk: base * 2, run: base * 4, fleet };
}

// Chance : maximum de points de Chance = Destin + niveau du talent ; Fort d'Esprit : idem pour la Détermination
export const luckBonus = (c) => timesAny(c, ['Chance', 'Chanceux', 'Luck']);
export const strongMindBonus = (c) => timesAny(c, ["Fort d'Esprit", 'Strong-minded']);
export const maxFortune = (c) => (+c.fate.fate || 0) + luckBonus(c);
export const maxResolve = (c) => (+c.fate.resilience || 0) + strongMindBonus(c);

export function encumbrance(c) {
  const sum = (arr) => arr.reduce((t, i) => t + (+i.enc || 0) * (i.qty != null ? (+i.qty || 0) : 1), 0);
  const weapons = sum(c.weapons);
  const armour = sum(c.armour);
  const items = sum(c.items);
  const max = charBonus(c, 'F') + charBonus(c, 'E') + (+c.encExtra || 0);
  return { weapons, armour, items, total: weapons + armour + items, max };
}

export function armourPoints(c) {
  const ap = Object.fromEntries(LOCATIONS.map((l) => [l.key, 0]));
  for (const a of c.armour) {
    if (!a.equipped) continue;
    for (const loc of a.locations || []) ap[loc] = (ap[loc] || 0) + (+a.ap || 0);
  }
  return ap;
}

export function weaponDamage(c, w) {
  const d = (w.damage || '').replace(/\s/g, '');
  const m = d.match(/^\+?BF([+-]\d+)?$/i);
  if (m) return charBonus(c, 'F') + (m[1] ? +m[1] : 0);
  return null;
}

// ---------- Carrière ----------
export function careerLevel(c) { return Math.min(Math.max(+c.career.level || 1, 1), 4); }

function levelsUpTo(c) { return c.career.levels.slice(0, careerLevel(c)); }

export function charInCareer(c, key) { return levelsUpTo(c).some((l) => (l.chars || []).includes(key)); }

export function skillInCareer(c, s) {
  const full = norm(skillLabel(s));
  const base = norm(s.name);
  return levelsUpTo(c).some((l) => (l.skills || []).some((x) => {
    const n = norm(x);
    // « Discrétion (Rurale) » dans la carrière compte pour la compétence de base « Discrétion »
    return n === full || n === base || (n.startsWith(base + ' (') && (!s.spec || /au choix|n.importe/.test(n)));
  }));
}

export function talentInCareer(c, name) {
  const n = norm(name);
  return levelsUpTo(c).some((l) => (l.talents || []).some((x) => norm(x) === n));
}

// Conditions pour terminer l'échelon actuel
export function careerProgress(c) {
  const lvl = careerLevel(c);
  const need = lvl * 5;
  const chars = [...new Set(levelsUpTo(c).flatMap((l) => l.chars || []))];
  const charsOk = chars.filter((k) => (+c.chars[k].advances || 0) >= need);
  const careerSkills = c.skills.filter((s) => skillInCareer(c, s));
  const skillsOk = careerSkills.filter((s) => (+s.advances || 0) >= need);
  const cur = c.career.levels[lvl - 1] || {};
  const curTalents = (cur.talents || []).filter((t) => talentTimes(c, t) > 0);
  const skillsNeeded = Math.min(8, careerSkills.length);
  return {
    need, chars, charsOk, skillsOk, skillsNeeded,
    talentsOk: curTalents,
    talentsNeeded: (cur.talents || []).length ? 1 : 0,
    complete: chars.length > 0 && charsOk.length === chars.length && skillsOk.length >= skillsNeeded && curTalents.length >= ((cur.talents || []).length ? 1 : 0),
  };
}

// ---------- Personnage vierge ----------
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export function newCharacter(name = 'Nouveau personnage', species = 'Humain') {
  return {
    id: uid(), name, species, className: '', age: '', height: '', hair: '', eyes: '',
    career: {
      name: '', level: 1, path: '',
      levels: [1, 2, 3, 4].map(() => ({ title: '', status: '', chars: [], skills: [], talents: [] })),
    },
    careerHistory: [],
    chars: Object.fromEntries(CHARS.map((ch) => [ch.key, { initial: 30, advances: 0, modifier: 0 }])),
    skills: BASIC_SKILLS.map(([name, char]) => ({ id: uid(), name, spec: '', char, advances: 0, basic: true })),
    talents: [],
    xp: { total: 0, spent: 0 },
    xpLog: [],
    fate: { fate: 0, fortune: 0, resilience: 0, resolve: 0, motivation: '' },
    health: { wounds: null, woundsExtra: 0, advantage: 0, conditions: {}, criticals: [] },
    corruption: 0, sin: 0, mutations: '', psychology: '',
    weapons: [], armour: [], items: [],
    money: { co: 0, pa: 0, sc: 0 }, encExtra: 0, moveOverride: '',
    spells: [],
    ambitions: { short: '', long: '' },
    party: { name: '', short: '', long: '', members: '' },
    notes: '',
    updatedAt: Date.now(),
  };
}

// Complète un personnage ancien avec les champs ajoutés depuis
export function upgradeCharacter(c) {
  const base = newCharacter(c.name, c.species);
  for (const k of Object.keys(base)) if (c[k] === undefined) c[k] = base[k];
  for (const k of Object.keys(base.health)) if (c.health[k] === undefined) c.health[k] = base.health[k];
  for (const ch of CHARS) c.chars[ch.key] ??= { initial: 30, advances: 0, modifier: 0 };
  return c;
}
