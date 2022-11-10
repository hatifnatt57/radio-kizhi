import styles from './TrackDownloader.css';
import disabledClickHandler from '../../utils/disabledClickHandler';
import { CIRCLE_IN_USER_POINTS } from '../../constants';

export default class TrackDownloader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.setStateAndProgressInitially();
    this.render();
  }

  static get observedAttributes() {
    return ['progress'];
  }

  get state() {
    return this.getAttribute('state');
  }

  set state(state) {
    this.setAttribute('state', state);
  }

  get progress() {
    return this.getAttribute('progress');
  }

  set progress(progress) {
    this.setAttribute('progress', progress);
  }

  get trackId() {
    return this.getAttribute('track-id');
  }

  get disabled() {
    return this.getAttribute('disabled');
  }

  set disabled(disabled) {
    this.setAttribute('disabled', disabled);
  }

  /**
   * Задает первичные значения атрибутов state и progress в соответствии с данными в IndexedDB.
   */
  async setStateAndProgressInitially() {
    const { storageManager } = window.$globalStorage;
    const trackMeta = await storageManager.getTrackMeta(this.trackId);
    if (!trackMeta) {
      this.state = 'ready';
      this.progress = '0';
    }
    else if (trackMeta.done) {
      this.state = 'done';
      this.progress = '1';
    }
    else {
      this.state = 'paused';
      this.progress = trackMeta.bytesDownloaded / trackMeta.bytesTotal;
    }
  }

  render() {
    const template = document.createElement('template');
    template.innerHTML = `
      <style>${styles}</style>
      <svg viewBox="0 0 54 54">
        <circle
          cx="27"
          cy="27"
          r="25"
          stroke="var(--downloader-border)"
          stroke-width="2"
          fill="var(--downloader-background)"
        ></circle>
        <circle
          cx="27"
          cy="27"
          r="25"
          stroke="var(--done)"
          stroke-width="2"
          fill="none"
          stroke-dasharray="${CIRCLE_IN_USER_POINTS}"
          stroke-dashoffset="var(--progress)"
          style="transition: .2s linear"
        ></circle>
      </svg>
      <button class="ready" type="button">
        <svg viewBox="0 0 16 16" fill="var(--text)">
          <path d="M7 0V12.17L1.41 6.58L0 8L8 16L16 8L14.59 6.59L9 12.17V0H7Z"/>
        </svg>
      </button>
      <button class="downloading" type="button">
        <svg viewBox="0 0 12 16" fill="var(--text)">
          <rect width="2" height="16"/>
          <rect x="10" width="2" height="16"/>
        </svg>
      </button>
      <button class="paused" type="button">
        <svg viewBox="0 0 18 16" fill="var(--text)">
          <rect x="2" width="2" height="16"/>
          <path d="M6 0L18 8L6 16V0Z"/>
        </svg>
      </button>
      <button class="done" type="button">
        <svg viewBox="0 0 18 14" fill="var(--done)">
          <path d="M1.5 6.5L0 8L6 14L18 2L16.5 0.5L6 11L5 10L1.5 6.5Z"/>
        </svg>
      </button>
    `;
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.shadowRoot.querySelector('.ready').addEventListener('click', this.readyAndPausedClickHandler.bind(this));
    this.shadowRoot.querySelector('.downloading').addEventListener('click', this.downloadingClickHandler.bind(this));
    this.shadowRoot.querySelector('.paused').addEventListener('click', this.readyAndPausedClickHandler.bind(this));
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'progress') {
      // Пересчитывает значение прогресса закачки из долей единицы в user points.
      const cssProgress = CIRCLE_IN_USER_POINTS * (1 - newValue);
      this.style.setProperty('--progress', cssProgress);
    }
  }

  readyAndPausedClickHandler() {
    if (this.disabled === 'true') {
      disabledClickHandler();
      return;
    }
    this.state = 'downloading';
    window.$globalStorage.downloadManager.enqueue(this);
  }

  downloadingClickHandler() {
    if (this.disabled === 'true') {
      disabledClickHandler();
      return;
    }
    this.state = 'paused';
    window.$globalStorage.downloadManager.dequeue(this);
  }
}
