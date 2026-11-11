# Grimoire WFRP — Feuille de personnage Warhammer 4e

Application pour téléphone et tablette Android qui gère ton personnage de **Warhammer Fantasy Roleplay 4e édition** :

- **Fiche** : caractéristiques, mouvement, compétences (de base, groupées, avancées), talents.
- **Combat** : tout sur un écran. Barre fixe (Blessures, Avantage, Chance), attaques par arme avec valeur de test et dégâts calculés, Esquive / Parade / Initiative, talents de combat, points d'armure, blessures critiques, Destin et Résilience. **Lanceur de dés** : difficulté, Avantage (+10 par point) ajouté automatiquement, réussite/échec, DR, critique ou maladresse, localisation (dés inversés) et dégâts (arme + DR), relance avec un point de Chance.
- **Sac** : richesses (CO/PA/SC avec rendu de monnaie), encombrement, armes (dégâts BF+X calculés), armures (portée/non portée), possessions.
- **Progrès** : XP actuelle/dépensée/totale, carrière et conditions pour terminer l'échelon, changement d'échelon (100 XP) ou de carrière (100/200 XP), **historique de l'XP** avec annulation.
- **Mode progression** (bouton ★ XP en haut) : des boutons **+** apparaissent à côté des caractéristiques, compétences et talents **seulement si tu as assez d'XP**. Les boutons dorés suivent ta carrière (coût normal), les rosés sont hors carrière (coût ×2).
- **Classes et carrières** : choix de la classe (Guerriers, Roublards…), carrières proposées selon la classe, et **bibliothèque de carrières partagée** : un schéma saisi une fois par un joueur est réutilisable par tout le groupe.
- **Bibliothèque de talents** : importe un fichier de talents (Menu ⋮ > Importer) ; à l'ajout d'un talent, la description se remplit seule, et le maximum (ex. « Bonus de I ») est calculé et respecté en mode progression.
- **Biblio** : onglet regroupant les bibliothèques partagées (carrières, talents, sorts) avec recherche. Un sort ajouté depuis la bibliothèque arrive dans le Carnet avec sa portée et sa durée calculées pour ton personnage (ex. « FM mètres (= 42) »).
- **Carnet** : identité, carrière, ambitions, groupe, sorts et prières, psychologie, corruption et mutations, notes.
- Plusieurs personnages, export/import en fichier JSON.

Tout est enregistré **sur l'appareil**, donc l'appli fonctionne **sans internet**. Dès que le réseau revient, les modifications sont envoyées en ligne automatiquement.

## Coût : 0 €, sans serveur

| Besoin | Solution gratuite |
|---|---|
| Héberger l'appli | **GitHub Pages** (gratuit) |
| Sauvegarde en ligne et synchro entre appareils | **Firebase** de Google, offre « Spark » (gratuite, **sans carte bancaire**) |

Tu n'as rien à faire tourner chez toi. Les limites gratuites de Firebase (50 000 lectures et 20 000 écritures par jour) sont des centaines de fois au-dessus de l'usage d'un joueur.

> Sans l'étape 2, l'appli marche quand même entièrement, mais seulement sur un appareil, sans sauvegarde en ligne.

---

## Étape 1 — Mettre l'appli en ligne (GitHub Pages, ~10 min)

1. Crée un compte gratuit sur <https://github.com>.
2. En haut à droite : **+** > **New repository**. Nom : `grimoire-wfrp`. Coche **Public**. Clique **Create repository**.
3. Clique **uploading an existing file**, puis glisse **tout le contenu du dossier** (`index.html`, `manifest.webmanifest`, `sw.js`, et les dossiers `css`, `js`, `icons`). Tu n'as pas besoin du PDF. Clique **Commit changes**.
4. Va dans **Settings** > **Pages**. Dans « Branch », choisis `main` et `/ (root)`, puis **Save**.
5. Après une minute, ton appli est en ligne à l'adresse `https://TON-PSEUDO.github.io/grimoire-wfrp/`.

## Étape 2 — Activer la sauvegarde en ligne (Firebase, ~10 min)

1. Va sur <https://console.firebase.google.com> avec ton compte Google. Clique **Créer un projet**, nomme-le (ex. `grimoire-wfrp`). Tu peux désactiver Google Analytics.
2. **Connexion Google** : menu de gauche **Créer** > **Authentication** > **Commencer** > onglet **Méthode de connexion** > **Google** > **Activer** > **Enregistrer**.
3. **Autoriser ton site** : toujours dans Authentication, onglet **Paramètres** > **Domaines autorisés** > **Ajouter un domaine** : `TON-PSEUDO.github.io`.
4. **Base de données** : **Créer** > **Firestore Database** > **Créer une base de données**. Choisis un emplacement en Europe (ex. `europe-west`), puis le **mode production**.
5. Onglet **Règles** de Firestore. Remplace tout par ce bloc, puis clique **Publier**. Ces règles garantissent que toi seul peux lire et modifier tes personnages.

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{uid}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
       match /talents/{id} {
         allow read: if request.auth != null;
         allow create: if request.auth != null && request.resource.data.authorUid == request.auth.uid;
         allow update: if request.auth != null && resource.data.authorUid == request.auth.uid && request.resource.data.authorUid == request.auth.uid;
         allow delete: if request.auth != null && resource.data.authorUid == request.auth.uid;
       }
       match /spells/{id} {
         allow read: if request.auth != null;
         allow create: if request.auth != null && request.resource.data.authorUid == request.auth.uid;
         allow update: if request.auth != null && resource.data.authorUid == request.auth.uid && request.resource.data.authorUid == request.auth.uid;
         allow delete: if request.auth != null && resource.data.authorUid == request.auth.uid;
       }
       match /careers/{id} {
         allow read: if request.auth != null;
         allow create: if request.auth != null && request.resource.data.authorUid == request.auth.uid;
         allow update: if request.auth != null && resource.data.authorUid == request.auth.uid && request.resource.data.authorUid == request.auth.uid;
         allow delete: if request.auth != null && resource.data.authorUid == request.auth.uid;
       }
     }
   }
   ```

6. **Récupérer la configuration** : roue dentée ⚙ > **Paramètres du projet** > en bas, « Vos applications » > icône **`</>`** (Web). Donne un nom, ne coche pas Hosting, puis **Enregistrer l'application**. Copie le bloc `const firebaseConfig = { ... }`.
7. Colle-le dans l'appli (déjà fait pour ce projet : voir `js/config.js`) :
   - **Simple** : dans l'appli, menu **⋮** > « Configuration Firebase » > colle le bloc > **Se connecter avec Google**. C'est à refaire une fois sur chaque appareil.
   - **Définitif** : sur GitHub, ouvre `js/config.js`, clique le crayon ✏ et remplis les valeurs. Plus besoin de rien coller sur tes appareils.

> Ces valeurs (apiKey, etc.) ne sont **pas des secrets** : elles servent juste à identifier ton projet. Ce sont les règles de l'étape 5 qui protègent tes données.

## Étape 3 — Installer sur Android

1. Ouvre `https://TON-PSEUDO.github.io/grimoire-wfrp/` dans **Chrome**.
2. Menu **⋮** de Chrome > **Installer l'application** (ou « Ajouter à l'écran d'accueil »).
3. L'icône (écusson rouge et marteau doré) apparaît sur ton écran d'accueil. L'appli s'ouvre en plein écran, comme une appli normale.
4. Touche le **nuage** en haut, puis connecte-toi avec Google. Tu restes connecté ensuite.

Fais pareil sur la tablette : tes personnages s'y retrouvent automatiquement.

## Le nuage en haut de l'écran

| Pastille | Signification |
|---|---|
| 🟢 verte | Tout est synchronisé |
| 🟡 jaune | Modifications enregistrées sur l'appareil, en attente d'envoi (par exemple hors ligne) |
| 🔴 rouge | Connexion à refaire ou erreur : touche le nuage |
| ⚪ grise | Sauvegarde en ligne non configurée |

Si tu modifies le même personnage sur deux appareils sans réseau, c'est la version modifiée **en dernier** qui gagne.

## Premiers pas

1. **Carnet** : nom, race (le mouvement et le calcul des Blessures en dépendent).
2. **Fiche** : touche chaque caractéristique pour saisir sa valeur initiale et ses augmentations déjà acquises. Fais pareil pour les compétences.
3. **Progrès** > **Renseigner ma carrière** : choisis la classe, puis la carrière dans la liste proposée. Si un camarade a déjà saisi ce schéma, touche **Charger ce schéma**. Sinon, recopie depuis ton livre les caractéristiques, compétences et talents de chaque échelon, et laisse cochée la case « bibliothèque » pour en faire profiter le groupe. C'est ce schéma qui indique à l'appli ce qui coûte le prix normal ou double.
4. En fin de séance : **Progrès** > **Gagner de l'XP**, puis active le **mode progression** et dépense tes points avec les boutons **+**.
5. Une erreur ? Le bouton ↶ de l'historique annule la dernière opération et rembourse l'XP.

## Règles appliquées (4e édition)

- **Caractéristiques**, coût par augmentation selon le nombre déjà pris : 25 (1–5), 30 (6–10), 40, 50, 70, 90, 120, 150, 190, 230, 280, 330, 390, 450, 520.
- **Compétences** : 10, 15, 20, 30, 40, 60, 80, 110, 140, 180, 220, 270, 320, 380, 440.
- **Talents** : 100 XP × (nombre de fois déjà pris + 1).
- **Hors carrière** : coût doublé.
- **Terminer un échelon** : toutes les caractéristiques de la carrière à 5 × échelon augmentations, 8 compétences de carrière à 5 × échelon, et 1 talent de l'échelon.
- **Échelon suivant** : 100 XP (échelon terminé). **Changer de carrière** : 100 XP si l'échelon est terminé, sinon 200 XP.

## Mettre à jour l'appli plus tard

Remplace les fichiers sur GitHub (Add file > Upload files). Les appareils récupèrent la nouvelle version à la prochaine ouverture avec du réseau. Tes personnages ne sont pas touchés.

## Tester sur ton PC

```bash
python -m http.server 8765
```

Puis ouvre <http://localhost:8765>. `localhost` est autorisé par défaut dans Firebase.
