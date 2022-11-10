/**
 * Превращает секунды в таймкод. С нулями.
 *
 * @param {number} seconds Время в секундах, может быть дробное.
 * @returns {string} Строка таймкода.
 */
export default function (seconds) {
  const minutesValue = Math.floor(seconds / 60);
  const minutesFormatted = minutesValue < 10 ? `0${minutesValue}` : minutesValue;
  const secondsValue = Math.floor(seconds % 60);
  const secondsFormatted = secondsValue < 10 ? `0${secondsValue}` : secondsValue;
  return `${minutesFormatted}:${secondsFormatted}`;
}
