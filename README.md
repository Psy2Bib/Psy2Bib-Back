<p align="center">
  <a href="https://github.com/Psy2Bib" target="_blank"><img src="https://img.shields.io/badge/npm-v11.6.4-blue" alt="NPM Version" /></a>
  <a href="https://github.com/Psy2Bib" target="_blank"><img src="https://img.shields.io/badge/node-25.2.1-blue" alt="NODE Version" /></a>
  <a href="https://github.com/Psy2Bib" target="_blank"><img src="https://img.shields.io/badge/NEST-v11.1.4-blue" alt="NEST Version" /></a>
  <a href="https://github.com/Psy2Bib" target="_blank"><img src="https://img.shields.io/badge/PostgreSQL-v17-blue" alt="POSTGRES Version" /></a>
  <a href="https://github.com/Psy2Bib" target="_blank"><img src="https://img.shields.io/badge/Docker-Compose-blue" alt="DOCKER Version" /></a>
</p>

# Psy2Bib Backend

Backend de l'application Psy2Bib, développé avec NestJS.
Ce projet fournit une API sécurisée pour la mise en relation de patients et psychologues, respectant les principes de **Zero-Knowledge** pour la confidentialité des données de santé.

## Fonctionnalités principales

- **Authentification JWT** sécurisée (Access + Refresh Tokens).
- **Architecture Zero-Knowledge** : Données patients et messages chiffrés côté client (E2EE).
- **Recherche de psychologues** (Nom, Spécialité, Langue).
- **Gestion des disponibilités et Rendez-vous**.
- **Visio-conférence** (Signalisation WebRTC sécurisée).
- **Messagerie instantanée** chiffrée de bout en bout.
- **Documentation API** interactive (Swagger).

## Documentation Détaillée

Pour les détails d'implémentation, les endpoints et les flux de données, voir :
👉 **[README_PSY2BIB_AUTH.md](./README_PSY2BIB_AUTH.md)**

## Swagger API

Une fois le serveur lancé, la documentation interactive est accessible sur :
👉 **http://localhost:3000/api**

## Installation et Démarrage

### Prérequis

- Docker & Docker Compose
- Node.js (si lancement local)

### Lancement avec Docker (Recommandé)

```bash
# Construire et démarrer les conteneurs
docker-compose up -d --build

# Voir les logs
docker-compose logs -f backend
```

L'API sera accessible sur `http://localhost:3000`.
La base de données PostgreSQL sera sur le port `5432`.

### Lancement local (Développement)

```bash
# Installation des dépendances
npm ci

# Démarrage en mode watch
npm run start:dev
```

### Déploiement (Neon ou Postgres managé)

1. Variables d'env (exemple Neon) :
   ```bash
   DATABASE_URL=postgres://<user>:<password>@<neon-host>:5432/<db>?sslmode=require
   DB_SSL=true
   DB_SYNC=false
   ```
   (`DB_SYNC=false` désactive la synchro automatique pour éviter les modifications non contrôlées en prod).
2. Générer une migration quand tu modifies les entités : `npm run migration:generate -- src/migrations/<Nom>` (ex: `npm run migration:generate -- src/migrations/init`)
3. Appliquer le schéma via migrations : `npm run migration:run` (utilise `.env`).
4. Construire l'image : `docker-compose -f docker-compose.yml build backend`
5. Lancer le conteneur : `docker-compose -f docker-compose.yml up backend`

### Utiliser Neon (PostgreSQL serverless)

1. Créez une base de données sur [Neon](https://neon.tech) et copiez l'URL de connexion Postgres (format `postgres://user:password@neonhost:5432/dbname`).
2. Dans `.env`, renseignez l'URL Neon et activez le TLS (les variables `DB_HOST/DB_USERNAME/...` sont ignorées si `DATABASE_URL` est présent) :
   ```bash
   DATABASE_URL=postgres://<user>:<password>@<neon-host>:5432/<db>
   DB_SSL=true
   ```
3. Démarrez l'API normalement (`npm run start:dev` ou `docker-compose up backend`). Le service Postgres du `docker-compose` n'est plus nécessaire quand vous pointez vers Neon.

## Tests

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

## Auteurs

- [CUI](https://github.com/ZrChristophe)
- [NADIFI](https://github.com/HamzaNADIFI07)
- [RADIVONIUK](https://github.com/nathanrdvnk)
