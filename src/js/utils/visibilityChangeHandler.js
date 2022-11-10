import { ACTIVE_KEY } from '../constants';

/**
 * Обработчик события visibilitychange.
 * При выходе из приложения или переводе его на задний план сохраняет данные о текущих таймкодах
 * аудиозаписей и о том - какая из записей прослушивалась последней.
 * Данные сохраняются в localStorage.
 */
export default function () {
  if (document.visibilityState === 'hidden') {
    localStorage.removeItem(ACTIVE_KEY);
    [...document.querySelectorAll('track-player')].forEach(playerElement => {
      const controlsElement = playerElement.shadowRoot.querySelector('track-controls');
      if (controlsElement.state === 'ended') {
        localStorage.setItem(controlsElement.trackId, 0);
      }
      else {
        if (controlsElement.state !== 'ready') {
          localStorage.setItem(ACTIVE_KEY, controlsElement.trackId);
        }
        localStorage.setItem(controlsElement.trackId, controlsElement.currentTime);
      }
    });
  }
}
