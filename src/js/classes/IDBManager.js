import { openDB } from 'idb';
import {
  DB_SCHEMA,
  DB_VERSION,
  DB_NAME
} from '../constants';

/**
 * Класс создает подключение к IndexedDB, выводит объект базы данных через геттер db.
 * Использует промис-обертку для IndexedDB для удобства пользования.
 *
 * @see https://www.npmjs.com/package/idb
 */
export default class IDBManager {
  constructor() {
    this.internal = {};
    this.connectToIDB();
  }

  async connectToIDB() {
    this.internal.db = await openDB(DB_NAME, DB_VERSION, {
      // Создает базу данных, удаляет все записи при изменении версии.
      upgrade(db, oldVersion, newVersion, transaction) {
        if (oldVersion === 0) {
          const store = db.createObjectStore(DB_SCHEMA.data.name, { autoIncrement: true });
          store.createIndex(DB_SCHEMA.data.index.name, DB_SCHEMA.data.index.key);
          db.createObjectStore(DB_SCHEMA.meta.name, { keyPath: DB_SCHEMA.meta.key });
        }
        else {
          const storeData = transaction.objectStore(DB_SCHEMA.data.name);
          const storeMeta = transaction.objectStore(DB_SCHEMA.meta.name);
          storeData.clear();
          storeMeta.clear();
        }
      }
    });
  }

  get db() {
    return this.internal.db;
  }
}
