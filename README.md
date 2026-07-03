# Pokédex : Temps Réel sous Stress

Application React Native / Expo réalisée dans le cadre d'un test technique. Elle comporte deux
écrans : une grille en scroll infini (« Battle Grid ») dans laquelle les statistiques des
Pokémon visibles à l'écran sont mises à jour toutes les 500ms afin de simuler un flux temps réel
agressif, et un écran de détail présentant types, évolutions et mouvements, qui fonctionne
entièrement hors-ligne dès qu'un Pokémon a été consulté au moins une fois.

Les données proviennent de [PokéAPI](https://pokeapi.co/docs/v2). Le brief ne fixe pas
d'exigence de design particulière ; les écrans ont néanmoins été redessinés par la suite à
partir d'une maquette Figma, dans un style rétro pixel-Pokédex. Voir la section
[Design](#design) ci-dessous.

## Démarrage

### Prérequis

- Node 20+, Xcode (iOS) et/ou Android Studio (Android)
- L'application **ne peut pas s'exécuter dans Expo Go**. `react-native-mmkv` v4 repose sur les
  Nitro Modules, ce qui nécessite un dev client personnalisé ainsi que la New Architecture
  (déjà activée dans `app.json`).

### Installation

```
npm install
```

### Lancer l'application

Premier lancement (compile et installe le dev client natif, puis démarre Metro) :

```
npm run ios      # ou : npm run android
```

Lors des lancements suivants, une fois le dev client déjà installé sur le simulateur ou
l'appareil :

```
npm start
```

puis ouvrir l'application déjà installée : elle se connecte automatiquement à Metro.

### Tests

```
npm test              # exécute les tests une fois
npm run test:watch    # mode watch
npm run test:coverage # avec rapport de couverture
npm run typecheck     # tsc --noEmit, mode strict
```

## Architecture

```
src/
  api/          client fetch, schémas Zod, mappers vers les types domaine, react-query
  types/        union discriminante AsyncState<T> + types domaine (PokemonSummary, PokemonDetail...)
  store/        store Zustand pilotant la simulation temps réel toutes les 500ms
  storage/      instance MMKV et cache hors-ligne (lecture/écriture)
  hooks/        hooks react-query, moteur de tick, timer sensible à l'AppState
  components/   PokemonCard, EvolutionChainView, StatBar/TypeBadge pixel, écran de splash
  screens/      BattleGridScreen, PokemonDetailScreen
  navigation/   stack react-navigation et types des paramètres de route
```

Chaque réponse de l'API suit le même traitement : **récupération → validation avec Zod →
conversion vers un type domaine**. En aval de `src/api/pokemonApi.ts`, aucun composant ne
manipule la forme brute renvoyée par PokéAPI : ils travaillent exclusivement avec
`PokemonSummary`, `PokemonDetail` ou `PokemonFullDetail`, jamais avec `PokemonDetailResponse`.
Si PokéAPI venait à renvoyer une structure inattendue, `.parse()` lèverait une erreur que
react-query remonterait comme un véritable état d'erreur, plutôt que de laisser l'interface se
comporter de manière incohérente avec des données partiellement valides.

Les états de chargement, de succès et d'erreur de l'interface sont représentés par une union
discriminante (`src/types/asyncState.ts`) :

```ts
type AsyncState<TData> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: TData };
```

Cette approche remplace le triplet classique `isLoading` / `isError` / `data`, qui autorise des
combinaisons incohérentes (par exemple `isLoading: true` alors que `data` est déjà renseigné).
Chaque écran effectue un `switch` sur `status`, et TypeScript déduit automatiquement le type de
`data` ou de `message` dans chaque branche.

### Pourquoi la simulation à 500ms ne dégrade pas le défilement

Il s'agit du problème central posé par le brief ; le raisonnement mérite donc d'être détaillé
plutôt que de se limiter au code.

**Le problème, concrètement.** Considérons vingt cartes Pokémon affichées à l'écran. Sans
optimisation particulière, chaque mise à jour de statistique toutes les 500ms entraînerait, par
défaut avec React, le redessin de la liste entière, y compris les cartes dont les valeurs n'ont
pas changé. Deux fois par seconde, sur vingt cartes, avec en parallèle un défilement qui doit
rester fluide : c'est précisément ce type de situation qui fait chuter le nombre d'images par
seconde. L'objectif de ce qui suit est qu'une carte ne se redessine que lorsque ses propres
statistiques changent, jamais à cause d'une autre carte ou du défilement lui-même.

- **React Query et Zustand sont volontairement dissociés.** React Query gère les données serveur
  réelles (liste paginée, statistiques de base de chaque Pokémon) et les conserve en mémoire
  pour la durée de la session. Zustand (`src/store/liveStatsStore.ts`) ne gère qu'une chose :
  les valeurs « live », simulées, qui évoluent rapidement. Les deux n'interfèrent jamais l'un
  avec l'autre : le tick de 500ms ne touche donc jamais le cache de react-query et ne déclenche
  jamais de nouvelle requête réseau.

- **Un seul minuteur global, et non un par carte.** `useLiveStatsEngine` fait tourner un unique
  minuteur (via `useAppStateAwareInterval`, détaillé plus bas) qui, toutes les 500ms, détermine
  quels Pokémon sont actuellement visibles à l'écran et ne met à jour que ceux-là. La visibilité
  provient du `onViewableItemsChanged` de la FlatList, stockée dans un `ref` plutôt que dans un
  state React, afin que le simple fait de faire défiler la liste ne redessine jamais l'écran
  entier.

- **Chaque carte ne s'abonne qu'à ses propres données.** Chaque `PokemonCard` s'abonne au store
  Zustand via `state.liveStats[pokemon.id]`, c'est-à-dire uniquement à la portion du store qui la
  concerne. Zustand ne redessine un composant que si cette portion précise a changé. Le moteur
  de tick ne remplace la référence en mémoire que pour les Pokémon effectivement mis à jour :
  une carte non visible conserve donc exactement la même référence d'un tick à l'autre et ne se
  redessine jamais. Ce comportement est vérifié directement dans `PokemonCard.test.tsx`, à
  l'aide d'un `React.Profiler` qui compte les rendus effectifs.

- **`PokemonCard` est enveloppée dans `React.memo`**, avec un comparateur personnalisé qui ne
  prend en compte que `pokemon.id`. Le callback `onPress` change de référence à chaque rendu du
  parent, puisqu'il s'agit d'une fonction inline, mais cela ne modifie jamais l'apparence de la
  carte ; il est donc volontairement exclu de la comparaison.

- **Réglages de la FlatList, et un élément retiré volontairement.** Une version antérieure
  fournissait un `getItemLayout` fixe afin d'éviter à la FlatList de mesurer chaque élément
  elle-même. Une fois que les cartes ont commencé à afficher davantage de contenu après
  résolution de leur requête de détail (badges de type, grille de statistiques complète plutôt
  qu'une simple ligne « chargement... »), la hauteur réelle de chaque carte s'est mise à varier
  au cours de sa propre durée de vie, ce qui a invalidé l'hypothèse d'une hauteur fixe et
  provoqué des sauts visibles lors du défilement, la FlatList se recalant d'elle-même. Le
  `getItemLayout` a été retiré plutôt que corrigé, aucune valeur fixe ne pouvant être correcte
  dès lors que la hauteur dépend elle-même de l'état de chargement.

### Gestion de l'AppState

`useAppStateAwareInterval` (`src/hooks/useAppStateAwareInterval.ts`) est un hook générique qui
ne démarre un minuteur que lorsque `AppState.currentState === 'active'`, et l'arrête dès que
l'application passe en arrière-plan, pour le relancer automatiquement au retour au premier plan.
Le moteur de statistiques en direct est construit sur cette base : le polling à 500ms, comme
tout autre minuteur construit selon le même principe, ne s'exécute jamais pendant que
l'utilisateur se trouve sur une autre application.

### Cache hors-ligne (Écran 2)

Le brief limite explicitement le cache hors-ligne à l'écran de détail ; c'est donc à cet endroit
qu'il est implémenté. Le cache de react-query n'existe qu'en mémoire : il disparaît dès que le
processus de l'application se termine, ce qui ne constitue pas un mode réellement autonome
hors-ligne. MMKV est un stockage clé-valeur synchrone et rapide sur disque, ce qui correspond
exactement au besoin d'un **cache à double sens (écriture puis lecture de secours)** :

```ts
async function fetchWithOfflineFallback(id: number): Promise<PokemonFullDetail> {
  try {
    const data = await fetchPokemonFullDetail(id);
    setCachedFullDetail(id, data); // écriture dans le cache à chaque récupération réussie
    return data;
  } catch (err) {
    const cached = getCachedFullDetail(id);
    if (cached) return cached;     // en cas d'échec, on retombe sur le disque
    throw err;                     // jamais consulté et hors-ligne : erreur légitime
  }
}
```

Cette logique est implémentée manuellement plutôt qu'à l'aide d'un plugin générique de
persistance react-query : le brief demande explicitement MMKV, et un cache écrit à la main tient
en quelques lignes avec un comportement d'échec explicite (jamais consulté et hors-ligne
entraîne une véritable erreur, comportement vérifié dans
`usePokemonFullDetailQuery.test.tsx`), plutôt que de reposer sur un mécanisme opaque.

### Pourquoi MMKV plutôt que SQLite

Ce qui est mis en cache pour l'écran 2 est un objet JSON par identifiant de Pokémon
(`PokemonDetail`, description et arbre d'évolution) : aucune requête relationnelle n'est
nécessaire. MMKV est un stockage clé-valeur synchrone (aucun `await` requis pour lire ou
écrire), ce qui garde le mécanisme de secours dans `fetchWithOfflineFallback` simple et rapide.
SQLite aurait imposé des requêtes asynchrones et un schéma pour des données qui ne sont, en
réalité, qu'un objet indexé par identifiant.

## Design

Le brief déprioritise explicitement le design visuel. Les écrans ont néanmoins été redessinés
par la suite à partir d'une maquette Figma, dans un style rétro pixel-Pokédex (polices
personnalisées, barre de statistiques segmentée, badges de type pixel, écran de splash et icône
de l'application). Ce travail vient se superposer à l'architecture décrite ci-dessus sans la
modifier : `PixelStatBar` et `PixelTypeBadge` ont remplacé les composants précédents, mais le
flux de données, le store, le cache et le moteur de tick restent inchangés.

## Tests

Une soixantaine de tests unitaires et d'intégration couvrent la couche API (validation Zod,
mappers, pipeline de récupération des données), le store Zustand, les hooks personnalisés, ainsi
que des composants et écrans testés avec `@testing-library/react-native`, avec environ 94% des
lignes couvertes (`npm run test:coverage`). Les quelques fichiers non couverts relèvent
soit du typage pur (aucune ligne exécutable à tester), soit d'un câblage trivial (instanciation
d'un client, configuration de navigation). Quelques tests méritent d'être signalés :

- `PokemonCard.test.tsx` utilise un `React.Profiler` afin de vérifier qu'une carte ne se
  redessine pas lorsque les statistiques d'un autre Pokémon changent, mais uniquement lorsque
  les siennes changent. Il s'agit là de la promesse de performance centrale du projet, testée
  directement plutôt qu'affirmée en commentaire.
- `usePokemonFullDetailQuery.test.tsx` simule un échec réseau et vérifie que le hook retombe
  correctement sur une entrée MMKV préalablement enregistrée : le mode hors-ligne est ainsi
  vérifié, et non simplement supposé fonctionnel.
- `EvolutionChainView.test.tsx` constitue un garde-fou direct contre un bug rencontré en
  pratique (la flèche entre deux évolutions n'était pas centrée pour une chaîne à deux étapes) :
  le test vérifie que le conteneur de la flèche possède bien la propriété `flex: 1`, qui est le
  mécanisme exact ayant permis de corriger ce bug.

`react-native-mmkv` et `AppState` sont mockés sous Jest (`jest.setup.js`, ainsi que des appels à
`Object.defineProperty` propres à certains tests), leur comportement natif n'étant pas
disponible dans l'environnement de test. Ces mocks reproduisent l'API réelle d'assez près pour
que les tests vérifient la logique applicative elle-même, et non le comportement des mocks.

## Points restants

- `react-native-reanimated` demeure une dépendance installée, héritée de la version de la barre
  de statistiques antérieure au redesign pixel, qui utilise désormais des blocs segmentés
  simples. Elle n'est plus utilisée dans `src/` et pourrait être retirée.
- Les mouvements (« moves ») ne figurent pas dans la maquette Figma de l'écran de détail, mais
  le brief les demande explicitement : ils restent donc affichés, dans un style cohérent avec le
  reste de l'écran, sous la section Évolution.
