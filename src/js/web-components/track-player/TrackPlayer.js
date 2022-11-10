import {
  TRACK_PLAYER_TOUCHEND_BOUNDS_X,
  TRACK_PLAYER_TOUCHEND_BOUNDS_Y
} from '../../constants';
import styles from './TrackPlayer.css';

/**
 * Коллбек для вызова объектом сonnectionStatus при изменении статуса подключения к сети.
 */
async function connectionStatusChangeHandler() {
  const { connectionStatus, storageManager } = window.$globalStorage;
  const correspondingTrackButton = document.querySelector(`track-button[track-id="${this.trackId}"]`);
  if (connectionStatus.status === 'online') {
    this.disabled = false;
    correspondingTrackButton.classList.remove('disabled');
  }
  else if (connectionStatus.status === 'offline' && !await storageManager.isDownloaded(this.trackId)) {
    this.disabled = true;
    correspondingTrackButton.classList.add('disabled');
  }
}

export default class TrackPlayer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  get trackId() {
    return this.getAttribute('track-id');
  }

  set trackId(trackId) {
    this.setAttribute('track-id', trackId);
  }

  render({ id, title, image }) {
    this.style.backgroundImage = `url(${image})`;
    this.trackId = id;
    const template = document.createElement('template');
    template.innerHTML = `
      <style>${styles}</style>
      <h2>${title}</h2>
      <track-downloader track-id=${id}></track-downloader>
      <track-controls track-id=${id}></track-controls>
      <button class="close" type="button">
        <svg viewBox="0 0 40 40" fill="var(--text)">
          <path d="M27 14.41L25.59 13L20 18.59L14.41 13L13 14.41L18.59 20L13 25.59L14.41 27L20 21.41L25.59 27L27 25.59L21.41 20L27 14.41Z"/>
        </svg>
      </button>
    `;
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    const closeButton = this.shadowRoot.querySelector('.close');
    closeButton.addEventListener('click', () => {
      this.unshow();
      document.querySelector('.offline-banner').classList.remove('offline-banner__show');
    });
    window.$globalStorage.connectionStatus.subscribe(connectionStatusChangeHandler.bind(this));
    const eventHandlers = [
      ['touchstart', this.thisTouchStartHandler.bind(this)],
      ['touchmove', this.thisTouchMoveHandler.bind(this)],
      ['touchcancel', this.thisTouchCancelHandler.bind(this)],
      ['touchend', this.thisTouchEndHandler.bind(this)]
    ];
    eventHandlers.forEach(([event, listener]) => this.addEventListener(event, listener));
  }

  static get observedAttributes() {
    return ['disabled'];
  }

  get disabled() {
    return this.getAttribute('disabled');
  }

  set disabled(disabled) {
    this.setAttribute('disabled', disabled);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'disabled') {
      this.shadowRoot.querySelector('track-downloader').setAttribute('disabled', newValue);
      this.shadowRoot.querySelector('track-controls').setAttribute('disabled', newValue);
    }
  }

  show() {
    this.classList.add('track-player__show');
  }

  unshow() {
    this.classList.remove('track-player__show');
  }

  thisTouchStartHandler(e) {
    this.classList.add('track-player__dragged');
    this.firstContactClientX = e.targetTouches[0].clientX;
    this.firstContactClientY = e.targetTouches[0].clientY;
  }

  thisTouchMoveHandler(e) {
    if (this.classList.contains('track-player__active')) {
      const newTop = e.targetTouches[0].clientY - this.firstContactClientY;
      if (newTop > 0)
        this.style.top = `${newTop}px`;
    }
    else {
      const newLeft = e.targetTouches[0].clientX - this.firstContactClientX;
      if (newLeft > 0)
        this.style.left = `${newLeft}px`;
    }
  }

  thisTouchCancelHandler() {
    this.classList.remove('track-player__dragged');
    this.firstContactClientX = null;
    this.firstContactClientY = null;
    this.style.left = '';
    this.style.top = '';
  }

  thisTouchEndHandler(e) {
    const { clientX, clientY } = e.changedTouches[0];
    if ((!this.classList.contains('track-player__active')
      && (clientX - this.firstContactClientX) > TRACK_PLAYER_TOUCHEND_BOUNDS_X)
      || (this.classList.contains('track-player__active')
      && (clientY - this.firstContactClientY) > TRACK_PLAYER_TOUCHEND_BOUNDS_Y))
      this.unshow();
    this.classList.remove('track-player__dragged');
    this.firstContactClientX = null;
    this.firstContactClientY = null;
    this.style.left = '';
    this.style.top = '';
  }
}
