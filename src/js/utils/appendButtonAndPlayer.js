/**
 * Создает элементы кнопки и плеера для одной аудиозаписи
 * из объекта данных с API и вставляет их в DOM.
 *
 * @param {object} trackData Объект метаданных аудиозаписи с API
 */
export default function (trackData) {
  const library = document.querySelector('.track-library');
  const item = document.createElement('li');
  const button = document.createElement('track-button');
  button.render(trackData);
  item.appendChild(button);
  library.appendChild(item);

  const mainElement = document.querySelector('main');
  const player = document.createElement('track-player');
  player.render(trackData);
  mainElement.appendChild(player);
}
