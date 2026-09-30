import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  getAuth,
  getRedirectResult,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
  signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const META_KEY = "malti_firebase_sync_meta_v1";
const MAX_SECTION_BYTES = 850 * 1024;
const SYNC_DELAY_MS = 1400;

const createElement = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
};

const byteLength = (value) => new TextEncoder().encode(String(value || "")).byteLength;

export async function initializeFirebaseSync({ firebaseConfig, host, backup, storage, core }) {
  if (!host || !backup || !storage || !core) return null;

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const database = getFirestore(app);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  await setPersistence(auth, browserLocalPersistence);

  const state = {
    user: null,
    busy: false,
    suppressLocal: false,
    syncTimer: null,
    conflictCount: 0,
    resyncRequested: false
  };

  const ui = createAccountUi(host);
  const keys = backup.keys.slice();
  const keySet = new Set(keys);

  const loadGlobalMeta = () => {
    const current = storage.getJson(META_KEY, {});
    return current && typeof current === "object" ? current : {};
  };

  const ensureDeviceId = () => {
    const meta = loadGlobalMeta();
    if (!meta.deviceId) {
      meta.deviceId = crypto.randomUUID ? crypto.randomUUID() : `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      meta.users = meta.users || {};
      storage.setJson(META_KEY, meta);
    }
    return meta.deviceId;
  };

  const loadUserMeta = () => {
    const meta = loadGlobalMeta();
    const userMeta = meta.users?.[state.user?.uid] || {};
    return {
      sections: userMeta.sections && typeof userMeta.sections === "object" ? userMeta.sections : {},
      lastSyncAt: userMeta.lastSyncAt || null
    };
  };

  const saveUserMeta = (userMeta) => {
    if (!state.user) return;
    const meta = loadGlobalMeta();
    meta.deviceId = meta.deviceId || ensureDeviceId();
    meta.users = meta.users || {};
    meta.users[state.user.uid] = userMeta;
    storage.setJson(META_KEY, meta);
  };

  const setStatus = (mode, label, details = "") => {
    ui.root.dataset.syncState = mode;
    ui.status.textContent = label;
    ui.details.textContent = details;
    ui.triggerStatus.textContent = label;
  };

  const updateUserUi = () => {
    const signedIn = Boolean(state.user);
    ui.signedOut.hidden = signedIn;
    ui.signedIn.hidden = !signedIn;
    ui.triggerLabel.textContent = signedIn ? (state.user.displayName?.split(/\s+/)[0] || "Account") : "Sign in";
    ui.email.textContent = state.user?.email || "";
    ui.initials.textContent = signedIn
      ? (state.user.displayName || state.user.email || "G").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()
      : "G";
    if (!signedIn) setStatus("local", "Saved locally", "Sign in to sync progress between devices.");
  };

  const localData = () => backup.exportBackup().data;

  const markDirty = (key) => {
    if (!state.user || !keySet.has(key)) return;
    const meta = loadUserMeta();
    meta.sections[key] = { ...(meta.sections[key] || {}), dirty: true };
    saveUserMeta(meta);
  };

  const markSynced = (meta, key, value) => {
    meta.sections[key] = {
      dirty: false,
      lastSyncedChecksum: core.checksum(value),
      syncedAt: new Date().toISOString()
    };
  };

  const progressCollection = () => collection(database, "users", state.user.uid, "progress");

  const loadRemoteDocs = async () => {
    const snapshot = await getDocs(progressCollection());
    return Object.fromEntries(snapshot.docs.map((entry) => [entry.id, entry.data()]));
  };

  const writeRemote = async (key, value) => {
    if (value !== null && byteLength(value) > MAX_SECTION_BYTES) {
      throw new Error(`${key} is too large to sync safely.`);
    }
    await setDoc(doc(database, "users", state.user.uid, "progress", key), {
      key,
      value: value ?? "",
      checksum: core.checksum(value),
      deleted: value === null,
      schemaVersion: storage.SCHEMA_VERSION,
      clientUpdatedAt: new Date().toISOString(),
      deviceId: ensureDeviceId(),
      updatedAt: serverTimestamp()
    });
  };

  const applyRemote = (key, value) => {
    state.suppressLocal = true;
    try {
      if (value === null) {
        storage.remove(key);
      } else {
        backup.validateEntry(key, value);
        storage.setString(key, value);
      }
    } finally {
      state.suppressLocal = false;
    }
  };

  const resolveConflicts = async (conflicts, choice, meta) => {
    for (const conflict of conflicts) {
      let value;
      if (choice === "cloud") {
        value = conflict.remoteDoc?.value ?? null;
        applyRemote(conflict.key, value);
      } else if (choice === "merge") {
        value = core.mergeRaw(conflict.key, conflict.localValue, conflict.remoteDoc?.value ?? null);
        applyRemote(conflict.key, value);
        await writeRemote(conflict.key, value);
      } else {
        value = conflict.localValue;
        await writeRemote(conflict.key, value);
      }
      markSynced(meta, conflict.key, value);
    }
  };

  const syncNow = async ({ interactive = true } = {}) => {
    if (state.busy) {
      state.resyncRequested = true;
      return;
    }
    if (!state.user || !navigator.onLine) {
      if (state.user && !navigator.onLine) setStatus("offline", "Offline", "Changes remain saved on this device.");
      return;
    }

    state.busy = true;
    ui.syncButton.disabled = true;
    setStatus("syncing", "Syncing", "Comparing local and cloud progress.");

    try {
      const [remoteDocs, data] = await Promise.all([loadRemoteDocs(), Promise.resolve(localData())]);
      const meta = loadUserMeta();
      const plan = core.buildPlan({ keys, localData: data, remoteDocs, sectionMeta: meta.sections });

      for (const item of plan.download) {
        const value = item.remoteDoc?.value ?? null;
        applyRemote(item.key, value);
        markSynced(meta, item.key, value);
      }
      for (const item of plan.upload) {
        await writeRemote(item.key, item.localValue);
        markSynced(meta, item.key, item.localValue);
      }
      plan.unchanged.forEach((item) => markSynced(meta, item.key, item.localValue));

      if (plan.conflicts.length) {
        state.conflictCount = plan.conflicts.length;
        if (!interactive) {
          meta.lastSyncAt = new Date().toISOString();
          saveUserMeta(meta);
          setStatus("attention", "Needs attention", `${plan.conflicts.length} progress section(s) changed on two devices.`);
          return;
        }
        const choice = await ui.askConflict(plan.conflicts.length);
        if (!choice) {
          setStatus("attention", "Needs attention", "Choose how to resolve the cloud progress conflict.");
          return;
        }
        await resolveConflicts(plan.conflicts, choice, meta);
      }

      state.conflictCount = 0;
      const latestData = localData();
      Object.entries(meta.sections).forEach(([key, section]) => {
        const latestValue = Object.prototype.hasOwnProperty.call(latestData, key) ? latestData[key] : null;
        if (core.checksum(latestValue) !== section.lastSyncedChecksum) section.dirty = true;
      });
      meta.lastSyncAt = new Date().toISOString();
      saveUserMeta(meta);
      window.dispatchEvent(new CustomEvent("malti-progress-change"));
      setStatus("synced", "Synced", `Last sync ${new Date(meta.lastSyncAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`);
    } catch (error) {
      console.error("Firebase progress sync failed", error);
      setStatus("error", "Sync failed", error.message || "Progress remains saved locally.");
    } finally {
      state.busy = false;
      ui.syncButton.disabled = false;
      if (state.resyncRequested) {
        state.resyncRequested = false;
        scheduleSync();
      }
    }
  };

  const scheduleSync = () => {
    window.clearTimeout(state.syncTimer);
    state.syncTimer = window.setTimeout(() => syncNow({ interactive: false }), SYNC_DELAY_MS);
  };

  window.addEventListener("malti-storage-change", (event) => {
    const key = event.detail?.key;
    if (state.suppressLocal || !keySet.has(key)) return;
    if (!state.user) {
      setStatus("local", "Saved locally", "Sign in to sync progress between devices.");
      return;
    }
    markDirty(key);
    if (state.busy) state.resyncRequested = true;
    setStatus("pending", "Pending sync", "A local change is waiting to upload.");
    scheduleSync();
  });

  window.addEventListener("storage", (event) => {
    if (!keySet.has(event.key)) return;
    markDirty(event.key);
    scheduleSync();
  });
  window.addEventListener("online", () => syncNow({ interactive: false }));
  window.addEventListener("offline", () => state.user && setStatus("offline", "Offline", "Changes remain saved on this device."));
  window.addEventListener("focus", () => state.user && syncNow({ interactive: false }));

  ui.signInButton.addEventListener("click", async () => {
    ui.signInButton.disabled = true;
    setStatus("syncing", "Signing in", "Opening Google account selection.");
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      if (["auth/popup-blocked", "auth/operation-not-supported-in-this-environment"].includes(error.code)) {
        await signInWithRedirect(auth, provider);
      } else if (error.code !== "auth/popup-closed-by-user") {
        console.error("Google sign-in failed", error);
        setStatus("error", "Sign-in failed", error.message || "Try again later.");
      } else {
        setStatus("local", "Saved locally", "Sign in to sync progress between devices.");
      }
    } finally {
      ui.signInButton.disabled = false;
    }
  });
  ui.signOutButton.addEventListener("click", () => signOut(auth));
  ui.syncButton.addEventListener("click", () => syncNow({ interactive: true }));

  await getRedirectResult(auth).catch((error) => console.warn("Google redirect sign-in did not complete.", error));
  onAuthStateChanged(auth, async (user) => {
    state.user = user;
    updateUserUi();
    if (user) await syncNow({ interactive: true });
  });
  updateUserUi();

  window.MaltiFirebaseSync = {
    getState: () => ({ signedIn: Boolean(state.user), busy: state.busy, conflictCount: state.conflictCount }),
    signOut: () => signOut(auth),
    syncNow: () => syncNow({ interactive: true })
  };
  return window.MaltiFirebaseSync;
}

function createAccountUi(host) {
  const root = createElement("div", "account-menu");
  root.dataset.syncState = "local";
  const trigger = createElement("button", "account-trigger");
  trigger.type = "button";
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-haspopup", "dialog");
  trigger.setAttribute("aria-controls", "cloud-account-panel");
  const initials = createElement("span", "account-initials", "G");
  initials.setAttribute("aria-hidden", "true");
  const triggerLabel = createElement("span", "account-trigger-label", "Sign in");
  const triggerStatus = createElement("span", "visually-hidden", "Saved locally");
  trigger.append(initials, triggerLabel, triggerStatus);

  const panel = createElement("div", "account-panel");
  panel.id = "cloud-account-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Google account and cloud progress");
  panel.hidden = true;
  const status = createElement("strong", "account-sync-status", "Saved locally");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  const details = createElement("p", "account-sync-details", "Sign in to sync progress between devices.");

  const signedOut = createElement("div", "account-state");
  const signInButton = createElement("button", "account-primary-action", "Sign in with Google");
  signInButton.type = "button";
  signedOut.append(signInButton);

  const signedIn = createElement("div", "account-state");
  signedIn.hidden = true;
  const email = createElement("p", "account-email");
  const actions = createElement("div", "account-actions");
  const syncButton = createElement("button", "account-secondary-action", "Sync now");
  const signOutButton = createElement("button", "account-secondary-action", "Sign out");
  syncButton.type = "button";
  signOutButton.type = "button";
  actions.append(syncButton, signOutButton);
  signedIn.append(email, actions);
  panel.append(status, details, signedOut, signedIn);
  root.append(trigger, panel);
  host.appendChild(root);

  trigger.addEventListener("click", () => {
    const open = panel.hidden;
    panel.hidden = !open;
    trigger.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("click", (event) => {
    if (root.contains(event.target)) return;
    panel.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
  });

  const askConflict = (count) => new Promise((resolve) => {
    const dialog = document.querySelector("[data-sync-conflict-dialog]") || createConflictDialog();
    dialog.querySelector("[data-sync-conflict-count]").textContent = String(count);
    const finish = (choice) => {
      dialog.close();
      resolve(choice || null);
    };
    dialog.querySelectorAll("[data-sync-choice]").forEach((button) => {
      button.onclick = () => finish(button.dataset.syncChoice);
    });
    dialog.oncancel = (event) => {
      event.preventDefault();
      finish(null);
    };
    dialog.showModal();
  });

  return { root, triggerLabel, triggerStatus, initials, panel, status, details, signedOut, signedIn, email, signInButton, signOutButton, syncButton, askConflict };
}

function createConflictDialog() {
  const dialog = createElement("dialog", "sync-conflict-dialog");
  dialog.dataset.syncConflictDialog = "";
  dialog.setAttribute("aria-labelledby", "sync-conflict-heading");
  dialog.innerHTML = `
    <form method="dialog">
      <span class="tag">Cloud sync</span>
      <h2 id="sync-conflict-heading">Progress changed on two devices</h2>
      <p><strong data-sync-conflict-count>0</strong> progress section(s) contain different local and cloud changes.</p>
      <div class="sync-conflict-actions">
        <button type="button" class="account-primary-action" data-sync-choice="merge">Merge progress</button>
        <button type="button" class="account-secondary-action" data-sync-choice="local">Use this device</button>
        <button type="button" class="account-secondary-action" data-sync-choice="cloud">Use cloud</button>
      </div>
      <button type="button" class="account-text-action" data-sync-choice="">Decide later</button>
    </form>
  `;
  document.body.appendChild(dialog);
  return dialog;
}
