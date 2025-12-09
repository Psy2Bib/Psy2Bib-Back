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

## Modules et fonctionnalités

### Gestion des psychologues
- Création et mise à jour du profil public  
- Recherche par nom, spécialité, langue  
- Visibilité publique du profil  
- Liaison automatique avec l’utilisateur  

### Gestion des patients
- Profil patient (données personnelles chiffrées)  
- Association avec compte utilisateur  

### Gestion des rendez-vous
- Création / modification / annulation  
- Gestion des disponibilités des psychologues  
- Vérification automatique de conflits  
- Partage patient ↔ psychologue  

### Chat en temps réel
- WebSocket Gateway dédié  
- Messages stockés en base  
- Émissions ciblées par room  

### Système de visio (WebRTC + WebSockets)
- Gateway `visio` pour la signalisation  
- Vérification JWT sur WebSocket  
- Jointure sécurisée à un rendez-vous  
- Échange de signaux WebRTC via Socket.io  

### Authentification & Sécurité
- JWT Access / Refresh  
- Guards HTTP + Guards WebSocket  
- Hash de refresh token en base  
- Rôles : `PATIENT`, `PSY`, `ADMIN`  

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

## Installation
1. Cloner le dépôt
git clone https://github.com/ton-repo/psy2bib-api.git
cd psy2bib-api
##  Swagger API

---

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
 
 ├── auth/                # Authentification, JWT, Guards
 
 ├── users/               # Utilisateurs (patients/psychologues)
 
 ├── patients/            # Profils patients
 
 ├── psychologists/       # Profils psychologues
 
 ├── appointments/        # Rendez-vous + disponibilités
 
 ├── chat/                # Chat temps réel
 
 ├── visio/               # WebRTC + WebSockets pour la visio
 
 ├── config/              # ORM config
 
 ├── app.module.ts        # Module principal
 
 └── main.ts              # Entrée application


---

## Base de données (TypeORM)
Entities principales :

- User

- Patient

- PsychologistProfile

- Appointment

- Availability

- Message

- Types de relations :

- User ↔ Patient (1:1)

- User ↔ PsychologistProfile (1:1)

- Psychologist ↔ Appointment (1:N)

- Patient ↔ Appointment (1:N)


## Auteurs

- [CUI](https://github.com/ZrChristophe)
- [NADIFI](https://github.com/HamzaNADIFI07)
- [RADIVONIUK](https://github.com/nathanrdvnk)