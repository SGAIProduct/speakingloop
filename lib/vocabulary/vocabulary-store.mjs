import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const emptyStore = () => ({ vocabularyCards: [], captureEvents: [] });

export class VocabularyStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.writeQueue = Promise.resolve();
  }

  async read() {
    try {
      const value = JSON.parse(await readFile(this.filePath, "utf8"));
      return {
        vocabularyCards: Array.isArray(value.vocabularyCards) ? value.vocabularyCards : [],
        captureEvents: Array.isArray(value.captureEvents) ? value.captureEvents : [],
      };
    } catch (error) {
      if (error.code === "ENOENT") return emptyStore();
      throw error;
    }
  }

  async write(value) {
    await mkdir(dirname(this.filePath), { recursive: true });
    this.writeQueue = this.writeQueue.then(() =>
      writeFile(this.filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8"),
    );
    await this.writeQueue;
  }

  async listCards({ userId = "local_user" } = {}) {
    const store = await this.read();
    return store.vocabularyCards
      .filter((card) => card.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getCard(cardId) {
    const store = await this.read();
    return store.vocabularyCards.find((card) => card.id === cardId) || null;
  }

  async capture(card, event) {
    const store = await this.read();
    const duplicate = store.vocabularyCards.find(
      (item) =>
        item.userId === card.userId &&
        item.expression.toLowerCase() === card.expression.toLowerCase(),
    );
    if (duplicate) {
      return { card: duplicate, duplicate: true };
    }
    store.vocabularyCards.push(card);
    store.captureEvents.push(event);
    await this.write(store);
    return { card, duplicate: false };
  }

  async updateCard(cardId, patch) {
    const store = await this.read();
    const index = store.vocabularyCards.findIndex((card) => card.id === cardId);
    if (index < 0) return null;
    store.vocabularyCards[index] = {
      ...store.vocabularyCards[index],
      ...patch,
      id: store.vocabularyCards[index].id,
      updatedAt: new Date().toISOString(),
    };
    await this.write(store);
    return store.vocabularyCards[index];
  }

  async deleteCard(cardId) {
    const store = await this.read();
    const before = store.vocabularyCards.length;
    store.vocabularyCards = store.vocabularyCards.filter((card) => card.id !== cardId);
    store.captureEvents = store.captureEvents.filter((event) => event.vocabularyCardId !== cardId);
    if (store.vocabularyCards.length === before) return false;
    await this.write(store);
    return true;
  }
}
