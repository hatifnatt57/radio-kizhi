/* eslint-disable no-console */
/* eslint-disable no-param-reassign */
/* eslint-disable no-await-in-loop */
import {
  DB_SCHEMA,
  BUFFER_SIZE
} from '../constants';

/**
 * Класс имеет внутреннюю очередь закачки файлов, в которую различные части приложения
 * могут добавлять/удалять файлы. Сама очередь состоит из соответствующих
 * компонентов track-downloader. Класс сам приводит свойства компонентов в соответствие
 * с прогрессом закачки. Скачиваются файлы по одному, новые добавляются в конец очереди.
 */
export default class DownloadManager {
  constructor() {
    this.state = 'idle';
    this.queue = [];
  }

  /**
   * Добавить компонент в конец очереди.
   *
   * @param {TrackDownloader} downloaderElement Компонент track-downloader для нужного файла.
   */
  enqueue(downloaderElement) {
    this.queue.push(downloaderElement);
    if (this.state === 'idle') {
      this.state = 'downloading';
      this.download(downloaderElement);
    }
  }

  /**
   * Убрать компонент из очереди.
   *
   * @param {TrackDownloader} downloaderElement Компонент track-downloader для нужного файла.
   */
  dequeue(downloaderElement) {
    const index = this.queue.findIndex(downloaderArg => downloaderArg === downloaderElement);
    this.queue.splice(index, 1);
  }

  /**
   * Запускает или продолжает закачку файла.
   *
   * @param {TrackDownloader} downloaderElement Компонент track-downloader для нужного файла.
   */
  async download(downloaderElement) {
    const { db } = window.$globalStorage.iDBManager;
    const url = window.$globalStorage.apiData.find(
      item => item.id === downloaderElement.trackId
    ).audio;
    const metaEntry = await db.get(DB_SCHEMA.meta.name, url);

    let response,
      cycle,
      rangeStart,
      rangeEnd,
      dataChunk;
    let [bytesDownloaded, bytesTotal, keyToPassToAddChunk] = Array(3).fill(0);
    let bufferArray = [];
    /**
     * Если часть аудиозаписи была скачана ранее - сделать fetch-запрос с range-заголовком,
     * выгрузить содержимое последнего незаполненного "куска" в рабочий массив bufferArray
     * и подготовить вспомогательные переменные для закачки.
     */
    if (metaEntry) {
      const rangeFrom = metaEntry.bytesDownloaded;
      response = await fetch(url, {
        headers: {
          range: `bytes=${rangeFrom}-`
        }
      });
      bytesTotal = metaEntry.bytesTotal;
      /**
       * Если последний "кусок" заполнен.
       * Случается при остановке закачки вследствие закрытия приложения.
       */
      if (metaEntry.bytesDownloaded % BUFFER_SIZE === 0) {
        cycle = metaEntry.bytesDownloaded / BUFFER_SIZE + 1;
        rangeStart = metaEntry.bytesDownloaded;
        rangeEnd = BUFFER_SIZE * cycle - 1;
        bytesDownloaded = rangeStart;
      }
      else {
        cycle = Math.ceil(metaEntry.bytesDownloaded / BUFFER_SIZE);
        rangeStart = Math.floor(metaEntry.bytesDownloaded / BUFFER_SIZE) * BUFFER_SIZE;
        rangeEnd = BUFFER_SIZE * cycle - 1;
        const rangeEndToSearchFor = metaEntry.bytesDownloaded - 1;
        const incompleteChunk = await db.getFromIndex(
          DB_SCHEMA.data.name,
          DB_SCHEMA.data.index.name,
          [url, rangeStart, rangeEndToSearchFor]
        );
        keyToPassToAddChunk = await db.getKeyFromIndex(
          DB_SCHEMA.data.name,
          DB_SCHEMA.data.index.name,
          [url, rangeStart, rangeEndToSearchFor]
        );
        bufferArray = Array.from(incompleteChunk.data);
        bytesDownloaded = rangeStart;
      }
    }
    /**
     * Если никакие части аудиозаписи не были скачаны ранее - сделать fetch-запрос
     * и подготовить вспомогательные переменные для закачки.
     */
    else {
      response = await fetch(url);
      bytesTotal = Number(response.headers.get('Content-Length'));
      cycle = 1;
      rangeStart = 0;
      rangeEnd = BUFFER_SIZE - 1;
      bufferArray = [];
    }

    /**
     * Добавляет/обновляет запись в базе. Также добавляет/обновляет метаданные.
     *
     * @param {object} dataItem Объект записи.
     * @param {number} key Ключ записи для обновления или 0 в случае отсутствия записи.
     */
    async function addChunk(dataItem, key) {
      bytesDownloaded += dataItem.data.length;
      downloaderElement.progress = bytesDownloaded / bytesTotal;
      const storeName = DB_SCHEMA.data.name;
      if (key !== 0) await db.put(storeName, dataItem, key);
      else await db.add(storeName, dataItem);

      const metaStoreName = DB_SCHEMA.meta.name;
      const done = bytesTotal === bytesDownloaded;
      const metaDataItem = {
        trackId: downloaderElement.trackId,
        url,
        done,
        bytesTotal,
        bytesDownloaded,
        mimeType: response.headers.get('Content-Type')
      };
      await db.put(metaStoreName, metaDataItem);
    }

    const reader = response.body.getReader();

    /**
     * Чтение потока. Если была нажата пауза или произошла ошибка сети - будет "выкинута" ошибка.
     * Ошибки будут обработаны в блоке catch.
     */
    try {
      do {
        // eslint-disable-next-line no-throw-literal
        if (downloaderElement.state === 'paused') throw 'pause';
        dataChunk = await reader.read();
        if (!dataChunk.done) {
          const { value } = dataChunk;
          const arrayFromUint = Array.from(value);
          /**
           * Если "кусок" слишком велик для текущего буфера -
           * заполнить текущий, загрузить его в базу, очистить буфер
           * и поместить туда остатки "куска".
           */
          if (bufferArray.length + value.byteLength > BUFFER_SIZE) {
            // Заполнить.
            const delta = Math.abs(bufferArray.length - BUFFER_SIZE);
            const lastBitOfArray = arrayFromUint.slice(0, delta);
            const remnantsOfArray = arrayFromUint.slice(delta);
            bufferArray = bufferArray.concat(lastBitOfArray);
            const uintFromArray = new Uint8Array(bufferArray);
            // Загрузить.
            const dataItem = {
              url,
              rangeStart,
              rangeEnd,
              data: uintFromArray
            };
            await addChunk(dataItem, keyToPassToAddChunk);
            // Обновить переменные.
            rangeStart = BUFFER_SIZE * cycle;
            rangeEnd = rangeStart + BUFFER_SIZE - 1;
            cycle += 1;
            keyToPassToAddChunk = 0;
            // Очистить буфер и поместить туда остатки.
            bufferArray = remnantsOfArray;
          }
          // Если "кусок" влезает в текущий буфер - поместить его туда.
          else bufferArray = bufferArray.concat(arrayFromUint);
        }
      } while (!dataChunk.done);
      // Если после чтения стрима что-то осталось в буфере - поместить это в базу.
      if (bufferArray.length !== 0) {
        const uintFromArray = new Uint8Array(bufferArray);
        rangeEnd = rangeStart + bufferArray.length - 1;
        const dataItem = {
          url,
          rangeStart,
          rangeEnd,
          data: uintFromArray
        };
        await addChunk(dataItem, keyToPassToAddChunk);
      }
      /**
       * Запись успешно скачана. Обновить состояние downloader'а.
       * Сделать fetch-запросы для иконок для mediaSession, чтобы они сохранились в кэш.
       */
      downloaderElement.state = 'done';
      const { icons } = window.$globalStorage.apiData.find(
        item => item.id === downloaderElement.trackId
      );
      await Promise.all(icons.map(icon => fetch(icon.src)));
    }
    // Была нажата пауза или произошла ошибка сети.
    catch (e) {
      reader.cancel();
      // Сохранить в базу текущее содержимое буфера.
      const uintFromArray = new Uint8Array(bufferArray);
      rangeEnd = rangeStart + bufferArray.length - 1;
      const dataItem = {
        url,
        rangeStart,
        rangeEnd,
        data: uintFromArray
      };
      await addChunk(dataItem, keyToPassToAddChunk);
      // Обновить состояние downloader'а.
      downloaderElement.state = 'paused';

      if (e === 'pause') console.warn('Загрузка поставлена на паузу.');
      else console.warn('Загрузка приостановлена из-за ошибки сети.');
    }

    /**
     * Убрать текущий downloader из очереди, если он не был удален ранее при нажатии на паузу.
     * Запустить следующий downloader при наличии.
     */
    if (this.queue[0] === downloaderElement) this.queue.shift();
    if (this.queue[0]) this.download(this.queue[0]);
    else this.state = 'idle';
  }
}
