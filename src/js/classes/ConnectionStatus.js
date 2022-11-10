/**
 * Класс следит за статусом интернет-соединения и при его изменении
 * выполняет коллбеки, записанные в его внутреннее хранилище
 * различными частями приложения.
 */

export default class ConnectionStatus {
  constructor() {
    this.internal = {
      status: navigator.onLine ? 'online' : 'offline',
      changeCallbacks: []
    };
    window.addEventListener('online', () => {
      this.internal.status = 'online';
      this.broadcast();
    });
    window.addEventListener('offline', () => {
      this.internal.status = 'offline';
      this.broadcast();
    });
  }

  /**
   * Возвращает статус интернет-соединения.
   *
   * @returns {string} Статус интернет-соединения.
   */
  get status() {
    return this.internal.status;
  }

  /**
   * Принимает коллбек и записывает его во внутреннее хранилище
   * для вызова при изменении статуса соединения. Единожды вызывает этот коллбек.
   *
   * @param {Function} callback Коллбек для вызова.
   */
  subscribe(callback) {
    this.internal.changeCallbacks.push(callback);
    callback();
  }

  /**
   * Вызывает коллбеки, записанные во внутреннее хранилище.
   */
  broadcast() {
    this.internal.changeCallbacks.forEach(
      callback => callback()
    );
  }
}
