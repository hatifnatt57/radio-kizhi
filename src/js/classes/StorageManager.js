import { ACTIVE_KEY, DB_SCHEMA } from '../constants';

/**
 * StorageManager предоставляет различным частям приложения интерфейс
 * для доступа к хранилищу данных - к IDB и localStorage.
 * Все  обращения к хранилищу идут через этот класс.
 */
export default class StorageManager {
  /**
   * Проверяет, скачана ли полностью аудиозапись с заданным идентификатором.
   *
   * @param {string} trackId Идентификатор трека.
   * @returns {Promise<boolean>} Скачан файл - или нет.
   */
  async isDownloaded(trackId) {
    const entry = await this.getTrackMeta(trackId);
    if (entry) return entry.done;
    return false;
  }

  /**
   * Возвращает метаданные аудиозаписи из IndexedDB по ее идентификатору.
   *
   * @param {string} trackId Идентификатор аудиозаписи.
   * @returns {Promise<(object|null)>} Объект метаданных аудиозаписи.
   */
  async getTrackMeta(trackId) {
    const { db } = window.$globalStorage.iDBManager;
    const url = window.$globalStorage.apiData.find(item => item.id === trackId).audio;
    const allTracksMeta = db ? await db.getAll(DB_SCHEMA.meta.name) : [];
    // eslint-disable-next-line no-shadow
    const entry = allTracksMeta.find(entry => entry[DB_SCHEMA.meta.key] === url);
    return entry || null;
  }

  /**
   * @typedef {object} TimestopAndIsActive
   * @property {number} timestop Время остановки прослушивания аудиозаписи.
   * @property {boolean} isActive Была ли аудиозапись последней прослушиваемой.
   */

  /**
   * Возвращает время остановки прослушивания аудиозаписи и была ли она последней прослушиваемой
   * при последнем использовании приложения. Данные берутся из localStorage.
   *
   * @param {string} trackId Идентификатор аудиозаписи
   * @returns {TimestopAndIsActive} Объект с описанными параметрами.
   */
  getTimestopAndIsActive(trackId) {
    const timestop = localStorage.getItem(trackId);
    const isActive = localStorage.getItem(ACTIVE_KEY) === trackId;
    return { timestop, isActive };
  }
}
