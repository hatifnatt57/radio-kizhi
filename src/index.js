/**
 * Имплементация классов и веб-компонентов, импорт дополнительных функций.
 */
import ConnectionStatus from './js/classes/ConnectionStatus';
import IDBManager from './js/classes/IDBManager';
import StorageManager from './js/classes/StorageManager';
import DownloadManager from './js/classes/DownloadManager';

import TrackButton from './js/web-components/track-button/TrackButton';
import TrackPlayer from './js/web-components/track-player/TrackPlayer';
import TrackDownloader from './js/web-components/track-downloader/TrackDownloader';
import TrackControls from './js/web-components/track-controls/TrackControls';

import appendButtonAndPlayer from './js/utils/appendButtonAndPlayer';
import visibilityChangeHandler from './js/utils/visibilityChangeHandler';

customElements.define('track-button', TrackButton);
customElements.define('track-player', TrackPlayer);
customElements.define('track-downloader', TrackDownloader);
customElements.define('track-controls', TrackControls);

const connectionStatus = new ConnectionStatus();
const iDBManager = new IDBManager();
const storageManager = new StorageManager();
const downloadManager = new DownloadManager();

/**
 * Глобальное хранилище классов для удобства доступа.
 */
window.$globalStorage = {
  connectionStatus,
  iDBManager,
  storageManager,
  downloadManager
};

/**
 * Регистрация service worker'а.
 */
window.addEventListener('load', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/serviceworker.js');
  }
});

/**
 * Отрисовка компонентов.
 */
fetch('http://localhost:3000/api/api.json')
  .then(res => res.json())
  .then(apiData => {
    window.$globalStorage.apiData = apiData;
    apiData.forEach(trackData => {
      appendButtonAndPlayer(trackData);
    });
  });

/**
 * Общее поведение сообщения об отсутствии подключения к сети (оффлайн-баннера).
 */
document.querySelector('.offline-banner button').addEventListener('click', () => {
  document.querySelector('.offline-banner').classList.remove('offline-banner__show');
});
window.$globalStorage.connectionStatus.subscribe(() => {
  document.querySelector('.offline-banner').classList.remove('offline-banner__show');
});

/**
 * Общая синхронизация состояния аудиоэлемента с состоянием медиасессии.
 *
 * @see https://web.dev/media-session/
 */
if ('mediaSession' in navigator) {
  const audioElement = document.querySelector('audio');
  audioElement.addEventListener('play', () => {
    navigator.mediaSession.playbackState = 'playing';
  });
  audioElement.addEventListener('pause', () => {
    navigator.mediaSession.playbackState = 'paused';
  });
}

/**
 * Имплементация сохранения состояния приложения при выходе или переводе приложения на задний план.
 */
document.addEventListener('visibilitychange', visibilityChangeHandler);
