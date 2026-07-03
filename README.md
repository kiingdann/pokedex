# Pokédex — Temps Réel sous Stress

Une application React Native / Expo réalisée dans le cadre d'un test technique. Deux écrans :
une grille en scroll infini (« Battle Grid ») où les statistiques des Pokémon visibles à l'écran
sont mises à jour toutes les 500ms pour simuler un flux temps réel agressif, et un écran de
détail avec types, évolutions et mouvements, qui fonctionne entièrement hors-ligne une fois
qu'un Pokémon a été consulté au moins une fois.

Les données viennent de [PokéAPI](https://pokeapi.co/docs/v2). Le brief ne demande pas de
design particulier, mais l'app a ensuite été redesignée à partir d'une maquette Figma dans un
style rétro pixel-Pokédex — voir [Design](#design) plus bas.

## Démarrage

### Prérequis

- Node 20+, Xcode (iOS) et/ou Android Studio (Android)
- L'app **ne peut pas tourner dans Expo Go**. `react-native-mmkv` v4 repose sur les Nitro
  Modules, ce qui nécessite un dev client custom et la New Architecture (déjà activée dans
  `app.json`).

### Installation

```
npm install
```

### Lancer l'app

Premier lancement (compile et installe le dev client natif, puis démarre Metro) :

```
npm run ios      # ou : npm run android
```

Les fois suivantes, une fois le dev client déjà installé sur le simulateur/appareil :

```
npm start
```

puis ouvrir l'app déjà installée sur l'appareil — elle se connecte à Metro automatiquement.

### Tests

```
npm test              # lance les tests une fois
npm run test:watch    # mode watch
npm run test:coverage # avec un rapport de couverture
npm run typecheck     # tsc --noEmit, mode strict
```

## Architecture

```
src/
  api/          client fetch, schémas zod, mappers vers les types domaine, react-query
  types/        union discriminante AsyncState<T> + types domaine (PokemonSummary, PokemonDetail...)
  store/        store zustand qui pilote la simulation temps réel toutes les 500ms
  storage/      instance MMKV + le cache hors-ligne (lecture/écriture)
  hooks/        hooks react-query, le moteur de tick, le timer qui écoute l'AppState
  components/   PokemonCard, EvolutionChainView, StatBar/TypeBadge pixel, l'écran de splash
  screens/      BattleGridScreen, PokemonDetailScreen
  navigation/   stack react-navigation + types des paramètres de route
```

Chaque réponse de l'API passe par le même pipeline : **fetch → validation avec Zod → mapping
vers un type domaine**. Rien en aval de `src/api/pokemonApi.ts` ne voit jamais la forme brute de
PokéAPI — les composants travaillent avec `PokemonSummary` / `PokemonDetail` /
`PokemonFullDetail`, jamais avec `PokemonDetailResponse`. Si PokéAPI renvoie un jour quelque
chose d'inattendu, `.parse()` lève une erreur et react-query la remonte comme un vrai état
d'erreur, plutôt que de laisser l'UI planter silencieusement avec des données à moitié valides.

Tous les états de chargement/succès/erreur de l'UI sont représentés par une union discriminante
(`src/types/asyncState.ts`) :

```ts
type AsyncState<TData> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: TData };
```

Ça remplace le trio classique `isLoading` / `isError` / `data`, qui autorise des combinaisons
impossibles (par exemple `isLoading: true` alors que `data` est déjà rempli). Chaque écran fait
un `switch` sur `status`, et TypeScript sait déduire le type de `data`/`message` tout seul — plus
besoin de deviner avec des `?.` un peu partout.

### Pourquoi la simulation à 500ms ne casse pas le scroll

C'est le vrai problème posé par le brief, donc ça vaut le coup d'expliquer le raisonnement et
pas juste balancer le code.

**Le problème concret, d'abord.** Imaginez 20 cartes Pokémon affichées à l'écran. Si on ne fait
rien de particulier, chaque tick de 500ms qui met à jour une stat va, par défaut avec React,
redessiner TOUTE la liste, même les cartes dont les chiffres n'ont pas bougé. Deux fois par
seconde, sur 20 cartes, avec en plus le scroll qui doit rester fluide à côté : c'est exactement
le genre de chose qui fait chuter le FPS. Le but de tout ce qui suit, c'est de faire en sorte
qu'une carte ne se redessine QUE quand SES PROPRES stats changent, jamais à cause d'une autre
carte ou du scroll lui-même.

- **React Query et Zustand sont volontairement séparés.** React Query gère les vraies données
  serveur (la liste paginée, les stats de base de chaque Pokémon) et les garde en mémoire pour
  la session. Zustand (`src/store/liveStatsStore.ts`) ne gère qu'une chose : les valeurs "live"
  qui bougent vite et sont fausses (simulées). Les deux ne se marchent jamais dessus, donc le
  tick de 500ms ne touche jamais au cache de react-query et ne déclenche jamais un re-fetch
  réseau.

- **Un seul timer global, pas un par carte.** `useLiveStatsEngine` fait tourner un seul minuteur
  (via `useAppStateAwareInterval`, voir plus bas) qui, toutes les 500ms, regarde quels Pokémon
  sont *actuellement visibles à l'écran* et ne met à jour que ceux-là. La visibilité vient du
  `onViewableItemsChanged` de la FlatList, stockée dans un `ref` — pas dans un state React —
  pour que le simple fait de scroller ne redessine jamais tout l'écran.

- **Chaque carte ne s'abonne qu'à ses propres données.** Chaque `PokemonCard` s'abonne au store
  zustand avec `state.liveStats[pokemon.id]`, c'est-à-dire uniquement la portion du store qui la
  concerne. Zustand ne redessine un composant que si CETTE portion précise a changé. Le moteur
  de tick ne remplace la référence en mémoire que pour les Pokémon réellement mis à jour, donc
  une carte non-visible garde exactement la même référence d'un tick à l'autre et ne se redessine
  jamais — c'est prouvé directement dans `PokemonCard.test.tsx`, qui compte les vrais rendus avec
  un `React.Profiler`.

- **`PokemonCard` est enveloppée dans `React.memo`**, avec une comparaison custom qui ne regarde
  QUE `pokemon.id`. Le callback `onPress` change de référence à chaque rendu du parent (c'est une
  fonction inline), mais ça ne change jamais l'apparence de la carte, donc on l'exclut
  volontairement de la comparaison.

- **Réglages de la FlatList, et une chose retirée volontairement.** Une version précédente
  passait un `getItemLayout` fixe pour éviter à la FlatList de mesurer chaque item elle-même.
  Mais une fois que les cartes se sont mises à afficher plus de contenu une fois leur détail
  chargé (badges de type, grille de stats complète vs. une ligne "chargement..."), la hauteur
  réelle de chaque carte s'est mise à varier dans le temps — ce qui a rendu l'hypothèse "hauteur
  fixe" fausse, et a fait sauter le scroll par moments (la FlatList se recalait toute seule).
  `getItemLayout` a été retiré plutôt que rafistolé : aucune valeur fixe ne peut être correcte à
  partir du moment où la hauteur dépend elle-même de l'état de chargement.

### Gestion de l'AppState

`useAppStateAwareInterval` (`src/hooks/useAppStateAwareInterval.ts`) est un petit hook
générique : il ne démarre un minuteur que quand `AppState.currentState === 'active'`, et le
coupe dès que l'app passe en arrière-plan, pour le relancer automatiquement au retour au premier
plan. Le moteur de stats live est construit dessus, donc le polling à 500ms — et n'importe quel
autre timer construit de la même façon — ne tourne jamais pendant que l'utilisateur est sur une
autre app.

### Cache hors-ligne (Écran 2)

Le brief scope explicitement le cache hors-ligne à l'écran de détail, donc c'est là qu'il vit.
Le cache de react-query est seulement en mémoire — il disparaît dès que le process de l'app
meurt, ce qui n'est pas vraiment un mode "100% autonome hors-ligne". MMKV est un stockage
clé-valeur synchrone et rapide sur disque, ce qui est exactement ce qu'il faut pour un **cache à
double sens (écriture puis lecture de secours)** :

```ts
async function fetchWithOfflineFallback(id: number): Promise<PokemonFullDetail> {
  try {
    const data = await fetchPokemonFullDetail(id);
    setCachedFullDetail(id, data); // on écrit dans le cache à chaque fetch réussi
    return data;
  } catch (err) {
    const cached = getCachedFullDetail(id);
    if (cached) return cached;     // en cas d'échec, on retombe sur le disque
    throw err;                     // jamais consulté avant + hors-ligne = vraie erreur, normal
  }
}
```

C'est fait à la main plutôt qu'avec un plugin générique de persistance react-query : le brief
demande MMKV explicitement, et un cache écrit à la main tient en quelques lignes avec un
comportement d'échec évident (jamais vu + hors-ligne = vraie erreur, testé dans
`usePokemonFullDetailQuery.test.tsx`), plutôt qu'une boîte noire.

### Pourquoi MMKV plutôt que SQLite

Ce qu'on met en cache pour l'écran 2, c'est un objet JSON par id de Pokémon (`PokemonDetail` +
description + arbre d'évolution) — pas besoin de requêtes relationnelles. MMKV est un
stockage clé-valeur synchrone (pas besoin de `await` pour lire/écrire), ce qui garde le fallback
dans `fetchWithOfflineFallback` simple et rapide ; SQLite aurait imposé des requêtes async et un
schéma pour des données qui sont en réalité juste "un objet, indexé par id".

## Design

Le brief déprioritise explicitement le design visuel. Les écrans ont ensuite été redessinés à
partir d'une maquette Figma dans un style rétro pixel-Pokédex (polices custom, barre de stats en
segments, badges de type pixel, écran de splash et icône de l'app). Ce travail vient se poser
au-dessus de l'architecture ci-dessus sans y toucher : `PixelStatBar` et `PixelTypeBadge` ont
remplacé les composants précédents, mais le flux de données, le store, le cache et le moteur de
tick n'ont pas changé.

## Tests

Une soixantaine de tests unitaires/d'intégration couvrant la couche API (validation zod,
mappers, pipeline de fetch), le store zustand, les hooks custom, et des tests de composants/
écrans avec `@testing-library/react-native` — environ 94% des lignes couvertes
(`npm run test:coverage`). Les quelques fichiers non couverts sont soit du typage pur (aucune
ligne exécutable à tester), soit du câblage trivial (instanciation d'un client, config de
navigation). Quelques tests qui valent le coup d'œil :

- `PokemonCard.test.tsx` — utilise un `React.Profiler` pour vérifier qu'une carte ne se
  redessine PAS quand les stats d'un AUTRE Pokémon changent, seulement les siennes. C'est la
  vraie promesse de performance, testée directement plutôt qu'affirmée dans un commentaire.
- `usePokemonFullDetailQuery.test.tsx` — simule un échec réseau et vérifie que le hook retombe
  bien sur une entrée MMKV pré-remplie, c'est-à-dire que le mode hors-ligne est vérifié, pas
  juste codé en espérant que ça marche.
- `EvolutionChainView.test.tsx` — garde-fou direct contre un vrai bug rencontré (la flèche entre
  deux évolutions n'était pas centrée pour une chaîne à 2 étapes) : le test vérifie que le
  conteneur de la flèche a bien `flex: 1`, qui est le mécanisme exact utilisé pour corriger le
  bug.

`react-native-mmkv` et `AppState` sont mockés sous Jest (`jest.setup.js` et des
`Object.defineProperty` par test) puisque leur comportement natif/OS réel n'est pas disponible
dans l'environnement de test — les mocks reproduisent l'API réelle d'assez près pour que les
tests vérifient la vraie logique applicative, pas les mocks eux-mêmes.

