# Release sur Verdaccio

Ce guide explique comment publier `@bearstudio/astro-assets-generation` sur un registre Verdaccio local pour tester la lib avant de la publier sur npm.

## Prérequis

- [Verdaccio](https://verdaccio.org/) installé (`npm install -g verdaccio`)
- pnpm installé

## 1. Démarrer Verdaccio

Dans un terminal séparé :

```bash
verdaccio
```

Verdaccio sera disponible sur `http://localhost:4873`.

## 2. Créer un compte (première fois uniquement)

```bash
npm adduser --registry http://localhost:4873
```

Renseigne un username, password et email (les valeurs peuvent être fictives pour un usage local).

## 3. Builder la lib

Depuis la racine du monorepo :

```bash
pnpm build
```

Ou uniquement le package :

```bash
cd packages/astro-assets-generation
pnpm build
```

## 4. Publier sur Verdaccio

```bash
cd packages/astro-assets-generation
pnpm verdaccio:publish
```

Ce script exécute :

```bash
pnpm publish --registry http://localhost:4873 --no-git-checks
```

> Le flag `--no-git-checks` permet de publier sans que le working tree soit propre.

## 5. Tester dans un projet

Dans le projet qui doit consommer la lib :

```bash
pnpm add @bearstudio/astro-assets-generation
```

## 6. Republier après des modifications

Si la version n'a pas changé, dépublie d'abord :

```bash
cd packages/astro-assets-generation
pnpm verdaccio:unpublish
```

Puis rebuild et republie :

```bash
pnpm build
pnpm verdaccio:publish
```

Si la version a changé (dans `package.json`), tu peux republier directement sans dépublier.

## Bump de version

Modifie manuellement le champ `version` dans `packages/astro-assets-generation/package.json` avant de publier.

Exemple :

```json
{
  "version": "0.3.0"
}
```
