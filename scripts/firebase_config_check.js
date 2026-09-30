const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const configPath = path.join(root, "assets", "data", "firebase-config.json");
const rulesPath = path.join(root, "firestore.rules");
const firebasePath = path.join(root, "firebase.json");
const syncPath = path.join(root, "assets", "js", "firebase-sync.js");
const headerPath = path.join(root, "assets", "js", "site-header.js");
const backupPath = path.join(root, "assets", "js", "progress-backup.js");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

const fail = (message) => {
  console.error(`fail ${message}`);
  process.exitCode = 1;
};

if (typeof config.enabled !== "boolean") fail("Firebase enabled flag must be boolean.");
const required = ["apiKey", "authDomain", "projectId", "appId"];
if (!config.firebaseConfig || typeof config.firebaseConfig !== "object") {
  fail("Firebase public configuration object is missing.");
} else if (config.enabled) {
  required.forEach((key) => {
    if (typeof config.firebaseConfig[key] !== "string" || !config.firebaseConfig[key].trim()) {
      fail(`Firebase sync is enabled without ${key}.`);
    }
  });
}

const serializedConfig = JSON.stringify(config);
if (/private[_-]?key|service[_-]?account|client[_-]?secret/i.test(serializedConfig)) {
  fail("Firebase browser configuration must not contain server credentials.");
}

const firebase = JSON.parse(fs.readFileSync(firebasePath, "utf8"));
if (firebase.firestore?.rules !== "firestore.rules") fail("firebase.json does not point to firestore.rules.");

const rules = fs.readFileSync(rulesPath, "utf8");
[
  "request.auth.uid == userId",
  "allowedSection(sectionId)",
  "request.resource.data.keys().hasAll",
  "request.resource.data.key == sectionId",
  "request.resource.data.value.size() <= 870400",
  "request.resource.data.updatedAt == request.time",
  "allow read, write: if false"
].forEach((fragment) => {
  if (!rules.includes(fragment)) fail(`Firestore rules are missing: ${fragment}`);
});

const backupSandbox = { window: { MaltiStorage: { SCHEMA_VERSION: 3 } } };
vm.runInNewContext(fs.readFileSync(backupPath, "utf8"), backupSandbox, { filename: backupPath });
backupSandbox.window.MaltiProgressBackup.keys.forEach((key) => {
  if (!rules.includes(`'${key}'`)) fail(`Firestore rules do not allow the progress key ${key}.`);
});

const sync = fs.readFileSync(syncPath, "utf8");
if (!sync.includes("firebasejs/12.19.0/firebase-auth.js")) fail("Firebase Auth SDK version is not pinned.");
if (!sync.includes("firebasejs/12.19.0/firebase-firestore.js")) fail("Firestore SDK version is not pinned.");
const header = fs.readFileSync(headerPath, "utf8");
if (!header.includes("firebase-config.json") || !header.includes("initializeFirebaseSync")) {
  fail("Site header does not initialize Firebase sync.");
}

if (!process.exitCode) {
  console.log(`Firebase sync configuration passed (${config.enabled ? "enabled" : "disabled until project credentials are supplied"}).`);
}
