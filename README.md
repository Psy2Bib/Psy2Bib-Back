<p align="center">
  <a href="https://github.com/Psy2Bib" target="_blank"><img src="https://img.shields.io/badge/npm-v11.6.4-blue" alt="NPM Version" /></a>
  <a href="https://github.com/Psy2Bib" target="_blank"><img src="https://img.shields.io/badge/node-25.2.1-blue" alt="NODE Version" /></a>
  <a href="https://github.com/Psy2Bib" target="_blank"><img src="https://img.shields.io/badge/NEST-v11.1.4-blue" alt="NEST Version" /></a>
  <a href="https://github.com/Psy2Bib" target="_blank"><img src="https://img.shields.io/badge/PostgreSQL-v17-blue" alt="POSTGRES Version" /></a>
  <a href="https://github.com/Psy2Bib" target="_blank"><img src="https://img.shields.io/badge/Docker-Compose-blue" alt="DOCKER Version" /></a>
</p>

# Psy2Bib Backend

Backend de l'application **Psy2Bib**, développé avec NestJS.  
Ce projet fournit une API sécurisée pour la mise en relation de patients et psychologues, respectant les principes de **Zero-Knowledge** pour la confidentialité des données de santé.

---

## Fonctionnalités principales

- **Authentification JWT** sécurisée (Access + Refresh Tokens).  
- **Architecture Zero-Knowledge** : Données patients et messages chiffrés côté client (E2EE).  
- **Recherche de psychologues** (Nom, Spécialité, Langue).  
- **Gestion des disponibilités et Rendez-vous**.  
- **Visio-conférence** avec signalisation WebRTC sécurisée.  
- **Messagerie instantanée** chiffrée de bout en bout.  
- **Documentation API** interactive via Swagger.

---

## Technologies utilisées

- **Backend** : NestJS, TypeScript  
- **Base de données** : PostgreSQL  
- **Authentification** : JWT (Access + Refresh Tokens)  
- **Conteneurisation** : Docker & Docker Compose  
- **Tests** : Jest (unit & e2e)  
- **Documentation** : Swagger  

---

## Documentation Détaillée

Pour les détails d'implémentation, les endpoints et les flux de données :  
👉 **[README_PSY2BIB_AUTH.md](./README_PSY2BIB_AUTH.md)**

---

##  Swagger API

Une fois le serveur lancé, la documentation interactive est accessible sur :  
👉 **http://localhost:3000/api**

---

## Installation et Démarrage

### Prérequis

- Docker & Docker Compose  
- Node.js (pour un lancement local)

### Lancement avec Docker (Recommandé)

```bash
# Construire et démarrer les conteneurs
docker-compose up -d --build

# Voir les logs
docker-compose logs -f backend

L'API sera accessible sur `http://localhost:3000`.
La base de données PostgreSQL sera sur le port `5432`.

### Lancement local (Développement)

```bash
# Installation des dépendances
npm ci

# Démarrage en mode watch
npm run start:dev
```

## Tests

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

## Architecture du projet
src/

 ├─ auth/           # Gestion JWT, stratégies access & refresh
 
 ├─ users/          # Gestion des utilisateurs
 
 ├─ appointments/   # Gestion des rendez-vous
 
 ├─ messages/       # Messagerie chiffrée
 
 ├─ common/         # Filtres, pipes, guards, interceptors
 
 └─ main.ts         # Point d'entrée de l'application


## Contribuer

1 Fork le projet

2 Crée une branche feature : git checkout -b feature/ma-feature

3 Commit tes changements : git commit -m "feat: ajout de ma feature"

4 Push sur ta branche : git push origin feature/ma-feature

5 Ouvre un Pull Request


## Auteurs

- [CUI](https://github.com/ZrChristophe)
- [NADIFI](https://github.com/HamzaNADIFI07)
- [RADIVONIUK](https://github.com/nathanrdvnk)
