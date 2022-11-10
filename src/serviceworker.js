/* eslint-disable no-restricted-globals */
import { DB_NAME, DB_SCHEMA } from './js/constants';

const staticCacheName = 'static-1';
const dynamicCacheName = 'dynamic-1';

const urlsToCache = [
  '/',
  '/styles.css',
  '/fonts/PT-Serif_Bold.woff',
  '/fonts/PT-Serif_Bold.woff2',
  '/fonts/Inter-Bold.ttf',
  '/dist/js/index.js',
  '/app.webmanifest',
  '/icons/180.png',
  '/icons/192.png',
  '/icons/384.png',
  '/icons/512.png',
  '/icons/1024.png',
  '/icons/favicon-32.png',
  '/icons/favicon-16.png',
  '/icons/favicon.ico'
];

self.addEventListener('install', async () => {
  const cache = await caches.open(staticCacheName);
  await cache.addAll(urlsToCache);
});

self.addEventListener('activate', async () => {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames
      .filter(name => name !== staticCacheName)
      .filter(name => name !== dynamicCacheName)
      .map(name => caches.delete(name))
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.destination === 'audio' || request.url.includes('.mp3')) {
    event.respondWith(tryAudioFromIDB(request));
  }
  else if (!request.url.includes('api')) {
    event.respondWith(cacheFirst(request));
  }
  else {
    event.respondWith(staleWhileRevalidate(request));
  }
});

/**
 * Описывает стратегию Cache First.
 *
 * @param {Request} request Объект запроса.
 */
async function cacheFirst(request) {
  const cache = await caches.open(staticCacheName);
  const cachedResponse = await cache.match(request);
  return cachedResponse || fetch(request);
}

/**
 * Описывает стратегию Stale While Revalidate.
 *
 * @param {Request} request Объект запроса.
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(dynamicCacheName);
  const cachedResponse = await cache.match(request);
  cache.add(request).catch(() => { });
  return cachedResponse || fetch(request);
}

/**
 * Взято с небольшими изменениями из приложения kino от Google.
 *
 * @see https://github.com/GoogleChrome/kino
 *
 * Respond to a request to fetch offline video file and construct a response stream.
 *
 * Includes support for `Range` requests.
 * @param {Request}     request    Request object.
 * @param {IDBDatabase} db         IDBDatabase instance.
 * @param {object}    fileMeta   File meta object.
 * @returns {Response} Response object.
 */

const getResponseStream = (request, db, fileMeta) => {
  const rangeRequest = request.headers.get('range') || '';
  const byteRanges = rangeRequest.match(/bytes=(?<from>[0-9]+)?-(?<to>[0-9]+)?/);
  const rangeFrom = Number(byteRanges?.groups?.from || 0);
  const rangeTo = Number(byteRanges?.groups?.to || fileMeta.bytesTotal - 1);
  /**
   * As the data is pulled from the stream, we need to keep
   * track of the current pointer in the range of data
   * requested.
   */
  let currentBytePointer = rangeFrom;

  const stream = new ReadableStream({

    pull(controller) {
      const rawIDB = db;
      const transaction = rawIDB.transaction(DB_SCHEMA.data.name, 'readonly');
      const store = transaction.objectStore(DB_SCHEMA.data.name);

      /**
       * This returns a cursor to all records within the following range:
       *
       * record.rangeStart <= currentBytePointer
       *
       * Then we iterate this collection in the reverse direction and grab the
       * first record and enqueue its data partially or in whole depending on
       * the originally requested byte range (`rangeFrom`, `rangeTo`).
       */
      const allEntriesForUrlRange = IDBKeyRange.bound(
        [request.url, -Infinity, -Infinity],
        [request.url, currentBytePointer, Infinity]
      );

      const index = store.index(DB_SCHEMA.data.index.name);
      const cursor = index.openCursor(allEntriesForUrlRange, 'prev');

      /**
       * If the result of calling pull() is a promise, pull() will not be called again
       * until said promise fulfills. If the promise rejects, the stream will become errored.
       *
       * @see https://web.dev/streams/
       */
      return new Promise(resolve => {
        cursor.onerror = controller.close;
        cursor.onsuccess = e => {
          if (e.target.result) {
            const dataChunk = e.target.result.value;
            const needsSlice = dataChunk.rangeStart < rangeFrom || dataChunk.rangeEnd > rangeTo;
            const outOfBounds = dataChunk.rangeEnd < currentBytePointer;

            if (outOfBounds) {
              controller.close();
            }
            else if (!needsSlice) {
              /**
               * No slicing needed, enqueue the whole data object.
               */
              controller.enqueue(dataChunk.data);
              currentBytePointer += dataChunk.data.length;
            }
            else {
              /**
               * The requested range only partially overlaps the current chunk range.
               * We need to slice the buffer and return only the requested portion of data.
               */
              const sliceBufferFrom = Math.max(0, rangeFrom - dataChunk.rangeStart);
              const sliceBufferTo = Math.min(
                dataChunk.rangeEnd - dataChunk.rangeStart + 1,
                rangeTo - dataChunk.rangeStart + 1
              );
              const bufferSlice = new Uint8Array(
                dataChunk.data.slice(sliceBufferFrom, sliceBufferTo)
              );
              controller.enqueue(bufferSlice);
              currentBytePointer += bufferSlice.length;
            }
          }
          else {
            controller.close();
          }

          resolve();
        };
      });
    }
  });

  const responseOpts = {
    status: rangeRequest ? 206 : 200,
    statusText: rangeRequest ? 'Partial Content' : 'OK',
    headers: {
      'Accept-Ranges': 'bytes',
      'Content-Type': fileMeta.mimeType || 'application/octet-stream',
      'Content-Length': rangeTo - rangeFrom + 1
    }
  };
  if (rangeRequest) {
    responseOpts.headers['Content-Range'] = `bytes ${rangeFrom}-${rangeTo}/${fileMeta.bytesTotal}`;
  }
  const response = new Response(stream, responseOpts);

  return response;
};

/**
 * Смотрит, есть ли в IndexedDB скачанная аудиозапись, и в зависимости от результата
 * вызывает функцию, создающую стрим из базы данных или делает fetch-запрос соответственно.
 *
 * @param {Request} request Объект запроса.
 * @returns {Promise<Response>} Промис ответа.
 */
function tryAudioFromIDB(request) {
  const DBOpenRequest = indexedDB.open(DB_NAME);

  return new Promise(resolve => {
    DBOpenRequest.onsuccess = function () {
      const db = DBOpenRequest.result;
      getData(db);
    };

    /**
     * Внутренняя функция, продолжающая то же самое.
     *
     * @param {IDBDatabase} db Объект базы данных.
     */
    function getData(db) {
      const transaction = db.transaction(DB_SCHEMA.meta.name, 'readonly');
      const objectStore = transaction.objectStore(DB_SCHEMA.meta.name);
      const objectStoreRequest = objectStore.get(request.url);
      const fetchOpts = {};
      const range = request.headers.get('range');
      if (range) fetchOpts.headers = { range };
      objectStoreRequest.onsuccess = function () {
        const audioMeta = objectStoreRequest.result;
        if (audioMeta && audioMeta.done) {
          resolve(getResponseStream(request, db, audioMeta));
        }
        else {
          resolve(fetch(request, fetchOpts));
        }
      };
    }
  });
}
