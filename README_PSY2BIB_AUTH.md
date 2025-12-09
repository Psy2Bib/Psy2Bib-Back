# Psy2Bib – Backend API & Intégration Front

Ce document décrit **tout ce qui est déjà implémenté** côté backend pour que l’équipe Front puisse se brancher proprement :

- Authentification & gestion des tokens
- Documentation API interactive (Swagger)
- Modèle Zero‑Knowledge (patients)
- Gestion des profils psychologues (recherche publique)
- Gestion des disponibilités des psychologues
- Réservation et annulation de rendez‑vous
- Visio-conférence (Signalisation WebRTC sécurisée)
- Messagerie instantanée chiffrée de bout en bout (E2EE)
- Conventions techniques (JWT, headers, formats)

> Tout ce qui suit reflète **l’implémentation actuelle** du backend NestJS fournie dans le projet.

---

## Sommaire

1. [Stack & conventions générales](#1-stack--conventions-générales)
2. [Modèle de données – Zero‑Knowledge](#2-modèle-de-données--zero‑knowledge)
3. [Authentification](#3-authentification)
4. [Gestion des Profils Psychologues](#4-gestion-des-profils-psychologues)
5. [Gestion des disponibilités (PSY)](#5-gestion-des-disponibilités-psy)
6. [Gestion des rendez‑vous (Appointments)](#6-gestion-des-rendez‑vous-appointments)
7. [Visio-Conférence (WebRTC)](#7-visio-conférence-webrtc)
8. [Messagerie Instantanée Chiffrée (E2EE)](#8-messagerie-instantanée-chiffrée-e2ee)
9. [Flux typiques côté Front](#9-flux-typiques-côté-front)

---

## 1. Stack & conventions générales

- **Backend** : NestJS + TypeScript
- **DB** : PostgreSQL (TypeORM)
- **Auth** : JWT (access + refresh)
- **Zéro‑connaissance** : toutes les données sensibles patient et messages sont chiffrés côté front.
- **Base URL (dev)** :  
  - API : `http://localhost:3000`
  - Swagger UI : `http://localhost:3000/api`
- **WebSockets** :
  - Visio : `http://localhost:3000/visio`
  - Chat : `http://localhost:3000/chat`

### 1.1. Documentation Swagger
Une documentation interactive complète est disponible sur `/api`. Elle détaille tous les DTOs, les types de retours et permet de tester les routes directement.

### 1.2. Rôles utilisateurs

Le champ `role` dans `User` (et dans les JWT) peut être :

- `PATIENT`
- `PSY`
- `ADMIN`

Les routes sont protégées par des guards JWT ; certaines sont **réservées** à un rôle spécifique (PSY ou PATIENT).

### 1.3. JWT & Authorization

- Les endpoints protégés exigent l’en-tête :

```http
Authorization: Bearer <accessToken>
```

- Le **payload** des JWT contient :

```json
{
  "sub": "<userId>",
  "email": "user@example.com",
  "role": "PATIENT" | "PSY" | "ADMIN",
  "iat": 1234567890,
  "exp": 1234569999
}
```

- L’`accessToken` a une durée de vie courte (ex: 15 minutes).
- Le `refreshToken` a une durée de vie plus longue (ex: 7 jours).

---

## 2. Modèle de données – Zero‑Knowledge

### 2.1. Table `users` — données non sensibles (en clair)

Contient :

- `id` (uuid)
- `email` (unique)
- `passwordHash` : **hash envoyé par le front** (SHA, bcrypt, argon, peu importe – le backend ne re-hash pas la valeur)
- `firstName`
- `lastName`
- `role` : `PATIENT` | `PSY` | `ADMIN`
- `refreshTokenHash` : hashé avec `bcrypt` côté backend
- `createdAt`
- `updatedAt`

> **Important** : le backend ne connaît jamais le mot de passe en clair.
> Le front génère un **`passwordHash`** et l’envoie tel quel au backend (inscription & login).

### 2.2. Table `patients` — données sensibles (100% chiffrées côté client)

Contient :

- `id` (uuid)
- `user_id` (FK → `users.id`)
- `encryptedMasterKey` (texte, base64 / blob)
- `salt` (texte, base64 / blob)
- `encryptedProfile` (texte, base64 / blob)
- `createdAt`
- `updatedAt`

Le backend ne manipule jamais ces valeurs en clair.  
Le front se charge :

1. De dériver la clé à partir du mot de passe.
2. De chiffrer le profil.
3. D’envoyer uniquement des blobs chiffrés (`encryptedMasterKey`, `salt`, `encryptedProfile`).

---

## 3. Authentification

### 3.1. Register – `POST /auth/register`

Crée un utilisateur + éventuellement son dossier patient chiffré.

- Si `role = PATIENT` : le backend crée **aussi** une entrée dans la table `patients` avec les blobs chiffrés.
- Si `role = PSY` : il ne crée que l’utilisateur (pas de patient).

#### Request body

```json
{
  "email": "alice@example.com",
  "passwordHash": "HASH_GENERE_COTE_FRONT",
  "firstName": "Alice",
  "lastName": "Durand",
  "encryptedMasterKey": "base64-encrypted-master-key",
  "salt": "base64-salt",
  "encryptedProfile": "base64-encrypted-profile",
  "role": "PATIENT"
}
```

> Pour un PSY, `encryptedMasterKey`, `salt`, `encryptedProfile` peuvent être ignorés ou fournis selon l’utilisation future. Le backend ne crée un patient que si `role === PATIENT`.

#### Réponse (PATIENT)

```json
{
  "accessToken": "JWT_ACCESS_TOKEN",
  "refreshToken": "JWT_REFRESH_TOKEN",
  "encryptedMasterKey": "base64-encrypted-master-key",
  "salt": "base64-salt",
  "encryptedProfile": "base64-encrypted-profile",
  "role": "PATIENT"
}
```

#### Réponse (PSY)

```json
{
  "accessToken": "JWT_ACCESS_TOKEN",
  "refreshToken": "JWT_REFRESH_TOKEN",
  "encryptedMasterKey": null,
  "salt": null,
  "encryptedProfile": null,
  "role": "PSY"
}
```

> Le backend ne renvoie **jamais** la clé en clair ni des secrets cryptographiques bruts.  
> Il ne fait que renvoyer ce qu’il stocke, déjà chiffré par le front.

---

### 3.2. Login – `POST /auth/login`

Le front envoie **l’email + le même hash de mot de passe** qu’à l’inscription.

#### Request body

```json
{
  "email": "alice@example.com",
  "passwordHash": "HASH_GENERE_COTE_FRONT"
}
```

#### Vérification côté backend

1. Charge l’utilisateur par `email`.
2. Compare **directement** `incomingPasswordHash === user.passwordHash`.
   - Pas de `bcrypt.compare` ici, le backend ne re-hash pas.

#### Réponse (même modèle que register)

```json
{
  "accessToken": "JWT_ACCESS_TOKEN",
  "refreshToken": "JWT_REFRESH_TOKEN",
  "encryptedMasterKey": "base64-encrypted-master-key",
  "salt": "base64-salt",
  "encryptedProfile": "base64-encrypted-profile",
  "role": "PATIENT"
}
```

En cas d’erreur (hash incorrect / utilisateur inconnu) :

```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

---

### 3.3. Refresh – `POST /auth/refresh`

Utilise le **refresh token** pour obtenir de nouveaux tokens + blobs ZK (pour les PATIENT).

#### Request

```http
POST /auth/refresh
Authorization: Bearer <refreshToken>
```

Body : vide.

#### Réponse

Même structure que le login.

---

### 3.4. Logout – `POST /auth/logout`

Invalide le refresh token en base de données.

#### Request
```http
POST /auth/logout
Authorization: Bearer <accessToken>
```

---

## 4. Gestion des Profils Psychologues

### 4.1. Recherche publique – `GET /psychologists`

Permet de rechercher des psychologues par nom, spécialité ou langue. Accessible sans authentification (ou avec, selon besoin).

#### Query Params
- `name`: Recherche partielle sur prénom ou nom.
- `specialty`: Filtre par spécialité (ex: "TCC").
- `language`: Filtre par langue (ex: "Français").

### 4.2. Gestion du profil (PSY) – `PUT /psychologists/me`

Permet au psychologue connecté de mettre à jour ses informations publiques.

#### Body
```json
{
  "title": "Psychologue Clinicien",
  "description": "Spécialisé dans les troubles anxieux...",
  "specialties": ["TCC", "Anxiété"],
  "languages": ["Français", "Anglais"],
  "isVisible": true
}
```

---

## 5. Gestion des disponibilités (PSY)

L’objectif : un PSY déclare ses créneaux disponibles, découpés en **slots de 30 minutes**.

### 5.1. Modèle `Availability`

En base, une disponibilité correspond à **un seul slot de 30 min** :

- `id` (uuid)
- `psy_id` (FK → users, role=PSY)
- `start` (timestamptz)
- `end` (timestamptz) – toujours `start + 30min`
- `isBooked` (bool)
- `createdAt`, `updatedAt`

### 5.2. Créer des créneaux – `POST /psy/availabilities`

> **Rôle requis** : `PSY`  
> **Auth** : `Authorization: Bearer <accessToken_psy>`

Le PSY envoie une **plage** (par exemple 09:00–11:00) et le backend la découpe en slots de 30 min :

- 09:00–09:30
- 09:30–10:00
- 10:00–10:30
- 10:30–11:00

#### Request

```json
{
  "date": "2025-12-01",
  "startTime": "09:00",
  "endTime": "11:00"
}
```

- `date` : au format `YYYY-MM-DD`
- `startTime` / `endTime` : au format `HH:mm`, sur un pas de 30 min
- La plage doit être un multiple de 30 minutes, sinon → `400 Bad Request`.

#### Réponse

```json
{
  "psyId": "uuid-du-psy",
  "count": 4,
  "slots": [
    {
      "id": "slot-1-uuid",
      "start": "2025-12-01T09:00:00.000Z",
      "end": "2025-12-01T09:30:00.000Z",
      "isBooked": false,
      "psy": { "...": "..." }
    }
  ]
}
```

---

### 5.3. Liste des créneaux d’un psy – `GET /psy/:id/availabilities`

> **Rôle** : n’importe quel user authentifié.  
> Typiquement utilisé par le front patient pour afficher les créneaux d’un psy.

#### Request

```http
GET /psy/<psyId>/availabilities
Authorization: Bearer <accessToken>
```

---

### 5.4. Recherche de créneaux – `GET /search/availabilities`

> **Rôle** : typiquement `PATIENT`, mais la route est accessible à tout utilisateur authentifié.

#### Query parameters disponibles

- `psyId` (optionnel mais très utile)
- `dateFrom` (optionnel) – ISO : ex `2025-12-01T00:00:00.000Z`
- `dateTo` (optionnel)
- `onlyAvailable` (optionnel, par défaut `true`) :
  - `true` → renvoie seulement les créneaux non réservés
  - `false` → renvoie tous les créneaux

---

## 6. Gestion des rendez‑vous (Appointments)

### 6.1. Modèle `Appointment`

- `id` (uuid)
- `psy_id` (FK → users, role=PSY)
- `patient_id` (FK → users, role=PATIENT)
- `availability_id` (FK → `Availability`, 1:1)
- `type` : `IN_PERSON` | `ONLINE`
- `status` : `PENDING` | `CONFIRMED` | `CANCELLED`  
  (par défaut : `CONFIRMED` à la création)
- `meetingId` (string, nullable) – utilisé quand `type = ONLINE` pour la visio
- `createdAt`, `updatedAt`

### 6.2. Réserver un créneau – `POST /appointments/book`

> **Rôle requis** : `PATIENT`  
> **Auth** : `Authorization: Bearer <accessToken_patient>`

Le patient reçoit depuis la recherche / listing un `availabilityId`, puis appelle cette route pour le réserver.

#### Request

```json
{
  "availabilityId": "uuid-du-slot",
  "type": "ONLINE"
}
```

- `type` :
  - `"ONLINE"` : génère un `meetingId` (pour la future visio)
  - `"IN_PERSON"` : `meetingId = null`

#### Réponse

```json
{
  "message": "Appointment booked successfully",
  "appointment": {
    "id": "appointment-uuid",
    "type": "ONLINE",
    "status": "CONFIRMED",
    "meetingId": "random-uuid-if-online",
    "psy": { "...": "..." },
    "patient": { "...": "..." },
    "availability": { "...": "..." }
  }
}
```

### 6.3. Annuler un rendez-vous – `PATCH /appointments/:id/cancel`

Permet d'annuler un rendez-vous. Libère le créneau de disponibilité associé.
Accessible au PATIENT ou au PSY concerné.

---

## 7. Visio-Conférence (WebRTC)

La visio repose sur un échange pair-à-pair (P2P) WebRTC. Le backend sert uniquement de serveur de signalisation (Signaling Server) via WebSockets.

### 7.1. Connexion WebSocket

- **Namespace** : `/visio`
- **Authentification** : JWT requis (Header `Authorization` ou query param `token` lors du handshake).

### 7.2. Événements

1. **`joinRoom`** : Le client envoie `{ appointmentId: string }`.
   - Le serveur vérifie que l'utilisateur est bien participant (PSY ou PATIENT) du RDV.
   - Si OK, il rejoint la room WebSocket correspondante.
   - Émet `userJoined` aux autres participants de la room.

2. **`signal`** : Pour l'échange WebRTC (Offer, Answer, ICE Candidates).
   - Le client envoie `{ room: appointmentId, signal: any }`.
   - Le serveur relaye le signal aux autres membres de la room.

---

## 8. Messagerie Instantanée Chiffrée (E2EE)

Messagerie sécurisée Zero-Knowledge. Le backend stocke les messages chiffrés mais ne peut pas les lire.

### 8.1. Modèle `Message`

- `sender`: User
- `recipient`: User
- `encryptedContent`: String (Texte chiffré AES-GCM en base64)
- `iv`: String (Vecteur d'initialisation en base64)
- `createdAt`: Date

### 8.2. WebSocket Chat

- **Namespace** : `/chat`
- **Authentification** : JWT requis.
- **Connexion** : À la connexion, l'utilisateur rejoint automatiquement une room privée `user:SON_ID`.

**Envoi de message (`sendMessage`)** :
- Client envoie : `{ recipientId, encryptedContent, iv }`.
- Serveur : 
  1. Sauvegarde en base.
  2. Émet `newMessage` dans la room `user:RECIPIENT_ID`.
  3. Renvoie le message confirmé à l'expéditeur.

### 8.3. Historique – `GET /chat/conversation/:userId`

Récupère tous les messages échangés avec un utilisateur donné, triés par date.

---

## 9. Flux typiques côté Front

### 9.1. Onboarding PATIENT

1. Le front dérive le mot de passe :
   - génère `passwordHash`
   - génère `encryptedMasterKey`, `salt`, `encryptedProfile`
2. Appel `POST /auth/register` (role = `PATIENT`).
3. Backend renvoie :
   - `accessToken`, `refreshToken`
   - `encryptedMasterKey`, `salt`, `encryptedProfile`, `role`
4. Le front stocke les tokens (secure storage) + blobs chiffrés localement.

### 9.2. Login PATIENT

1. Le front recalcule le **même** `passwordHash` (à partir du mot de passe saisi).
2. Appel `POST /auth/login` avec `{ email, passwordHash }`.
3. Récupération :
   - `accessToken`, `refreshToken`
   - `encryptedMasterKey`, `salt`, `encryptedProfile`, `role`
4. Le front redécrypte les données si nécessaire.

### 9.3. Choix d’un psy et réservation

1. Le front utilise `GET /psychologists` (recherche) ou `GET /search/availabilities`.
2. Affiche les slots disponibles (30 min).
3. Quand le patient choisit un slot :
   - Appel `POST /appointments/book` avec `{ availabilityId, type }`.
4. Actualise :
   - `GET /appointments/my` pour afficher ses rendez‑vous.
   - `GET /psy/appointments` côté psy pour voir son agenda.
