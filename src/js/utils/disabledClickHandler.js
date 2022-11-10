/**
 * Хэндлер события нажатия на любой кликабельный элемент отключенного (disabled) компонента.
 * Показывает оффлайн-баннер.
 */
export default function () {
  document.querySelector('.offline-banner').classList.add('offline-banner__show');
}
