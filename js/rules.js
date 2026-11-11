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

// États : icône, aide-mémoire court (résumé, voir le livre pour le détail),
// allTests = −10 par niveau à tous les tests (compté dans le malus du lanceur de dés)
export const CONDITIONS = [
  { name: 'Hémorragique', stack: true, icon: '🩸', effect: 'Perd 1 Blessure par niveau à la fin du round.' },
  { name: 'Sonné', stack: true, icon: '💫', allTests: true, effect: '−10 par niveau aux tests ; actions limitées.' },
  { name: 'À terre', stack: false, icon: '⤵️', effect: 'Au sol : plus facile à toucher en mêlée. Se relever coûte un déplacement.' },
  { name: 'Épuisé', stack: true, icon: '😮‍💨', allTests: true, effect: '−10 par niveau aux tests. Se soigne par le repos.' },
  { name: 'Empoisonné', stack: true, icon: '☠️', allTests: true, effect: '−10 par niveau aux tests ; le poison continue d\'agir à chaque round.' },
  { name: 'En flammes', stack: true, icon: '🔥', effect: 'Brûle à chaque fin de round tant que le feu n\'est pas éteint.' },
  { name: 'Aveuglé', stack: true, icon: '🕶️', effect: '−10 par niveau aux tests utilisant la vue ; plus facile à toucher.' },
  { name: 'Assourdi', stack: true, icon: '🔇', effect: '−10 par niveau aux tests utilisant l\'ouïe ; plus facile à surprendre.' },
  { name: 'Empêtré', stack: true, icon: '🕸️', effect: 'Ne peut pas se déplacer ; −10 par niveau aux tests physiques.' },
  { name: 'Brisé', stack: true, icon: '💔', allTests: true, effect: 'Terrifié : cherche à fuir ; −10 par niveau aux autres tests.' },
  { name: 'Surpris', stack: false, icon: '❗', effect: 'Aucune action ce round ; disparaît à la fin du round.' },
  { name: 'Inconscient', stack: false, icon: '💤', effect: 'Hors de combat, sans défense.' },
];

// Malus des états qui touchent tous les tests : { value: -20, from: ['Sonné 1', 'Épuisé 1'] }
export function conditionPenalty(c) {
  let levels = 0;
  const from = [];
  for (const cd of CONDITIONS) {
    const n = +c.health.conditions?.[cd.name] || 0;
    if (cd.allTests && n > 0) { levels += n; from.push(`${cd.name} ${n}`); }
  }
  return { value: -10 * levels, from };
}

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

// Valeur d'une portée / durée / zone de sort pour ce personnage :
// « FM mètres » → valeur de FM, « Bonus FM Rounds » → bonus de FM, « Bonus Instinct minutes » → bonus d'I…
const SPELL_WORDS = [[/force mentale|\bfm\b/, 'FM'], [/instinct|initiative/, 'I'], [/intelligence|\bint\b/, 'Int'],
  [/endurance/, 'E'], [/sociabilite|\bsoc\b/, 'Soc'], [/agilite|\bag\b/, 'Ag'], [/force|\bf\b/, 'F']];
export function spellValue(c, text) {
  const s = norm(text);
  const m = s.match(/(bonus\s+(de\s+|d')?)?(force mentale|fm|instinct|initiative|intelligence|int|endurance|sociabilite|soc|agilite|ag|force)\b/);
  if (!m) return null;
  const key = SPELL_WORDS.find(([re]) => re.test(m[3]))?.[1];
  if (!key) return null;
  return m[1] ? charBonus(c, key) : charValue(c, key);
}

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

// Corruption : au-delà de BE + BFM, test de mutation
export const corruptionMax = (c) => charBonus(c, 'E') + charBonus(c, 'FM');

// ---------- Combat et jets de dés ----------
const MELEE_REACH = ['personnelle', 'tres courte', 'courte', 'moyenne', 'longue', 'tres longue', 'immense'];
const RANGED_GROUPS = ['arc', 'arbalete', 'fronde', 'poudre noire', 'lancer', 'explosifs', 'ingenierie', 'entrave', 'arme de jet'];

export function isRangedWeapon(w) {
  const reach = norm(w.reach);
  if (/\d/.test(reach)) return true;
  if (MELEE_REACH.includes(reach)) return false;
  return RANGED_GROUPS.includes(norm(w.group));
}

// Compétence utilisée par une arme : Corps à corps (Groupe) ou Projectiles (Groupe)
export function weaponSkill(c, w) {
  const ranged = isRangedWeapon(w);
  const base = ranged ? 'projectiles' : 'corps a corps';
  const group = norm(w.group);
  const skills = c.skills.filter((s) => norm(s.name).startsWith(base));
  let skill = skills.find((s) => norm(s.spec) === group && group)
    || (!ranged && (!group || group === 'base') ? skills.find((s) => norm(s.name) === 'corps a corps (base)') : null);
  if (!skill && !ranged) skill = skills.find((s) => norm(s.name) === 'corps a corps (base)');
  if (skill && (skill.advances > 0 || skill.basic)) {
    return { ranged, skill, value: skillValue(c, skill), label: skillLabel(skill), trained: true };
  }
  // Sans la compétence : on teste la caractéristique seule
  const key = ranged ? 'CT' : 'CC';
  return { ranged, skill: null, value: charValue(c, key), label: `${key} · sans ${ranged ? 'Projectiles' : 'Corps à corps'}${w.group ? ` (${w.group})` : ''}`, trained: false };
}

// Résultat d'un test d100 : réussite, degrés de réussite (DR), critique sur un double
export function rollResult(target, roll) {
  const r = Math.min(100, Math.max(1, Math.round(roll)));
  const tens = (n) => Math.floor(Math.min(n, 100) / 10);
  let success = r <= target;
  if (r <= 5) success = true;
  if (r >= 96) success = false;
  let sl = tens(target) - tens(r);
  if (success && sl < 0) sl = 0;
  if (!success && sl > 0) sl = 0;
  if (r <= 5 && sl < 1) sl = 1;
  const double = r < 100 && r % 11 === 0;
  return { roll: r, target, success, sl, critical: double && success, fumble: (double || r === 100) && !success };
}

// Localisation : on inverse les chiffres du jet (34 → 43)
export function hitLocation(roll) {
  const s = String(roll % 100).padStart(2, '0');
  const n = +(s[1] + s[0]) || 100;
  const key = n <= 9 ? 'tete' : n <= 24 ? 'brasG' : n <= 44 ? 'brasD' : n <= 79 ? 'corps' : n <= 89 ? 'jambeG' : 'jambeD';
  return { n, key, name: LOCATIONS.find((l) => l.key === key).name };
}

export const DIFFICULTIES = [
  ['60', 'Très facile (+60)'], ['40', 'Facile (+40)'], ['20', 'Moyenne (+20)'], ['0', 'Exigeante (+0)'],
  ['-10', 'Difficile (−10)'], ['-20', 'Ardue (−20)'], ['-30', 'Très difficile (−30)'],
];

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
