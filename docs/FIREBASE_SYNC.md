# Firebase progress sync

The site remains local-first. Firebase adds optional Google sign-in and cross-device progress sync; it is not required for offline study.

## Firebase console setup

1. Create a Firebase project and register a Web app.
2. In Authentication, enable the Google provider.
3. Add `javaquasar.github.io` and `localhost` to Authentication authorized domains.
4. Create a Cloud Firestore database. Choose a European location because the primary audience is in Malta.
5. Copy the Web app's public configuration into `assets/data/firebase-config.json` and set `enabled` to `true`.

Only these public browser fields belong in the repository:

```json
{
  "enabled": true,
  "firebaseConfig": {
    "apiKey": "...",
    "authDomain": "PROJECT_ID.firebaseapp.com",
    "projectId": "PROJECT_ID",
    "appId": "..."
  }
}
```

Do not add a service-account key, private key, client secret, or refresh token.

## Deploy security rules

Authenticate the Firebase CLI and select the project:

```powershell
npx firebase-tools login
npx firebase-tools use --add
npx firebase-tools deploy --only firestore:rules
```

Run the local checks before publishing:

```powershell
npm run cloud-sync:check
npm run firebase:check
npm run pwa:build
```

## Data model

Each user can access only their own collection:

```text
users/{uid}/progress/{storageKey}
```

Progress sections are synchronized independently. Each document contains a validated string value, checksum, schema version, device id, deletion marker, client timestamp, and Firestore server timestamp. Values above 850 KiB are rejected before upload.

## Conflict behavior

- A local-only change uploads automatically.
- A cloud-only change downloads automatically.
- Independent sections synchronize without prompting.
- If the same section changed locally and remotely, the user chooses Merge progress, Use this device, or Use cloud.
- Seen-word lists are unioned, best times keep the lowest value, successful counters keep the highest value, and dated records prefer the newest dated fields.
