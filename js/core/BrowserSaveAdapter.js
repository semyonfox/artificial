import { config } from "./config.js";

const LAST_ACTIVE_KEY = "lastActive";
const IMPORT_BACKUP_KEY = `${config.storage.saveKey}:before-import`;

/**
 * Owns browser APIs used by save persistence. Domain code receives plain data
 * and remains responsible for validating it.
 */
export class BrowserSaveAdapter {
  constructor({ storage, clipboard, confirmAction } = {}) {
    this.storage = storage;
    this.clipboard = clipboard;
    this.confirmAction = confirmAction;
  }

  getStorage() {
    const storage = this.storage ?? globalThis.localStorage;
    if (!storage) throw new Error("Browser storage is unavailable");
    return storage;
  }

  read(key) {
    const storage = this.getStorage();
    if (typeof storage?.getItem === "function") return storage.getItem(key);
    return storage?.get(key) ?? null;
  }

  write(key, value) {
    const storage = this.getStorage();
    if (typeof storage?.setItem === "function") {
      storage.setItem(key, String(value));
      return;
    }
    if (typeof storage?.set === "function") {
      storage.set(key, String(value));
      return;
    }
    throw new Error("Browser storage is not writable");
  }

  remove(key) {
    const storage = this.getStorage();
    if (typeof storage?.removeItem === "function") {
      storage.removeItem(key);
      return;
    }
    if (typeof storage?.delete === "function") {
      storage.delete(key);
      return;
    }
    throw new Error("Browser storage cannot remove values");
  }

  readSave() {
    return this.read(config.storage.saveKey);
  }

  writeSave(saveData) {
    this.write(config.storage.saveKey, JSON.stringify(saveData));
  }

  removeSave() {
    this.remove(config.storage.saveKey);
  }

  readLastActive() {
    return this.read(LAST_ACTIVE_KEY);
  }

  writeLastActive(timestamp) {
    this.write(LAST_ACTIVE_KEY, timestamp);
  }

  removeLastActive() {
    this.remove(LAST_ACTIVE_KEY);
  }

  readImportBackup() {
    const rawBackup = this.read(IMPORT_BACKUP_KEY);
    if (!rawBackup) return null;

    try {
      const backup = JSON.parse(rawBackup);
      return backup && typeof backup === "object" && !Array.isArray(backup)
        ? backup
        : null;
    } catch {
      return null;
    }
  }

  writeImportBackup(saveData) {
    this.write(IMPORT_BACKUP_KEY, JSON.stringify({
      saveData,
      lastActive: this.readLastActive(),
      createdAt: Date.now(),
    }));
  }

  removeImportBackup() {
    this.remove(IMPORT_BACKUP_KEY);
  }

  async copyText(value) {
    const clipboard = this.clipboard ?? globalThis.navigator?.clipboard;
    if (typeof clipboard?.writeText !== "function") {
      throw new Error("Clipboard access is unavailable");
    }
    await clipboard.writeText(value);
  }

  confirm(message) {
    const confirmAction = this.confirmAction ?? globalThis.confirm;
    return typeof confirmAction === "function" ? confirmAction(message) : false;
  }
}
