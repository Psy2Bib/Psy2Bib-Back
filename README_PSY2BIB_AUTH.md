
# Psy2Bib – Authentification & Zero‑Knowledge (Backend)

Ce document résume l’implémentation complète de l’authentification sécurisée, la séparation des données sensibles, et l’architecture Zero‑Knowledge (E2EE) actuellement en place dans le backend.

---

## Architecture Zero‑Knowledge

### Table `users` — données **non sensibles (en clair)**

Contient :
- `id`
- `email`
- `passwordHash` (bcrypt)
- `firstName`
- `lastName`
- `role` (`PATIENT`, `PSY`, `ADMIN`)
- `refreshTokenHash` (hashé)
- timestamps

→ Aucune donnée médicale ou psychologique n’est stockée ici.

### Table `patients` — données **sensibles (100% chiffrées côté client)**

Contient :
- `id`
- `user_id` (FK vers `users`)
- `encryptedMasterKey`
- `encryptionSalt`
- `encryptedProfile`
- timestamps

→ Ces colonnes contiennent uniquement des blobs AES‑GCM envoyés par le frontend.

---

## Endpoints disponibles

### 1. `POST /auth/register`
Créer un utilisateur + son dossier patient chiffré.

#### Body JSON

```json
{
  "email": "alice@example.com",
  "password": "MonMotDePasse123",
  "firstName": "Alice",
  "lastName": "Durand",
  "encryptedMasterKey": "base64-string",
  "encryptionSalt": "base64-string",
  "encryptedProfile": "base64-string",
  "role": "PATIENT"
}
```

#### Réponse

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "encryptedMasterKey": "...",
  "encryptionSalt": "...",
  "encryptedProfile": "...",
  "role": "PATIENT"
}
```

---

### 2. `POST /auth/login`

#### Body JSON

```json
{
  "email": "alice@example.com",
  "password": "MonMotDePasse123"
}
```

#### Réponse

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "encryptedMasterKey": "...",
  "encryptionSalt": "...",
  "encryptedProfile": "...",
  "role": "PATIENT"
}
```

---

### 3. `POST /auth/refresh`

#### Header
```
Authorization: Bearer <refreshToken>
```

#### Body  
Vide.

#### Réponse  
Même structure que login.

---

## Sécurité mise en place

- Mot de passe hashé avec `bcrypt` (12 rounds)
- Refresh token stocké hashé
- JWT séparés :
  - Access token (15 min)
  - Refresh token (7 jours)
- Full Zero‑Knowledge :
  - Le backend **ne voit jamais** les données sensibles
  - Tout est chiffré avant d’arriver sur le serveur

---

## Schéma des tables

### Table `users`

| Colonne | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| email | varchar | Unique |
| passwordHash | varchar | Hashé |
| firstName | varchar | Non null |
| lastName | varchar | Non null |
| role | enum | PATIENT/PSY/ADMIN |
| refreshTokenHash | text | Hashé |
| createdAt | timestamp | Auto |
| updatedAt | timestamp | Auto |

### Table `patients`

| Colonne | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → users.id |
| encryptedMasterKey | text | ZK |
| encryptionSalt | text | ZK |
| encryptedProfile | text | ZK |
| createdAt | timestamp | Auto |
| updatedAt | timestamp | Auto |

---

## Instructions Postman

### Register
POST `http://localhost:3000/auth/register`  
→ Body : tous les champs.

### Login  
POST `http://localhost:3000/auth/login`  
→ Body : email + password uniquement.

### Refresh  
POST `http://localhost:3000/auth/refresh`  
→ Header `Authorization: Bearer <refreshToken>`

---

## Status du projet

- Auth sécurisée 100% fonctionnelle  
- Stockage séparé (users/patients) opérationnel  
- Données sensibles totalement chiffrées  
- Endpoints testés & validés via Postman  
- Architecture prête pour l’étape suivante : **gestion des sessions, visio, notes, profils psy/patient…**

---

## Next steps possibles

- Endpoint pour mettre à jour le profil patient (toujours chiffré)
- Endpoint pour la liste des psychologues
- Mise en place sécurisée des rendez‑vous & visio
- Implémentation des notes thérapeutiques chiffrées

---
