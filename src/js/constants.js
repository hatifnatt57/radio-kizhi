/**
 * Название базы данных IndexedBD.
 */
export const DB_NAME = 'tracksStorage';

/**
 * Версия базы данных IndexedDB.
 */
export const DB_VERSION = 1;

/**
 * Схема наименований базы данных IndexedDB.
 */
export const DB_SCHEMA = {
  meta: {
    name: 'trackMeta',
    key: 'url'
  },
  data: {
    name: 'trackData',
    index: {
      name: 'trackChunk',
      key: ['url', 'rangeStart', 'rangeEnd']
    }
  }
};

/**
 * Ключ значения активной аудиозаписи в localStorage.
 */
export const ACTIVE_KEY = 'activeId';

/**
 * Длина окружности прогресса закачки аудиозаписи в user points.
 * Для использования в svg в компоненте track-downloader. Подбирается вручную.
 */
export const CIRCLE_IN_USER_POINTS = 158;

/**
 * Размер одной записи в IndexedDB в байтах.
 */
export const BUFFER_SIZE = 2000000;

/**
 * Значения шагов назад и вперед при перемотке аудиозаписи в секундах.
 */
export const SEEK_BACKWARDS_STEP = 15;
export const SEEK_FORWARDS_STEP = 30;

/**
 * Частота обновления UI проигрывателя аудиозаписи в миллисекундах.
 */
export const TIMER_UPDATE_FREQUENCY = 100;

/**
 * Расстояние от низа экрана до границы, внутри которой отпущенный track-player,
 * удерживаемый за drawer, вернется обратно в закрытое положение. В пикселях.
 */
export const DRAWER_TOUCHEND_BOUNDS = 150;

/**
 * Расстояние от первого касания track-player'а при его перетаскивании из открытого
 * положения до границы, внутри которой track-player вернется обратно - в открытое положение.
 * Для активного компонента. В пикселях.
 */
export const TRACK_PLAYER_TOUCHEND_BOUNDS_Y = 150;

/**
 * Расстояние от первого касания track-player'а при его перетаскивании из открытого
 * положения до границы, внутри которой track-player вернется обратно - в открытое положение.
 * Для неактивного компонента. В пикселях.
 */
export const TRACK_PLAYER_TOUCHEND_BOUNDS_X = 150;
