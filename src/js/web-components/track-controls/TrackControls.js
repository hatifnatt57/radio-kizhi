import styles from './TrackControls.css';
import secondsToTimecode from '../../utils/secondsToTimecode';
import disabledClickHandler from '../../utils/disabledClickHandler';
import {
  CIRCLE_IN_USER_POINTS,
  DRAWER_TOUCHEND_BOUNDS,
  SEEK_BACKWARDS_STEP,
  SEEK_FORWARDS_STEP,
  TIMER_UPDATE_FREQUENCY
} from '../../constants';

export default class TrackControls extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.trackId = this.getAttribute('track-id');
    this.trackData = window.$globalStorage.apiData.find(entry => entry.id === this.trackId);
    this.trackDuration = this.trackData.duration;
    this.trackPlayerParent = document.querySelector(`track-player[track-id="${this.trackId}"]`);
    this.audioElement = document.querySelector('audio');
    this.render();
  }

  render() {
    const template = document.createElement('template');
    template.innerHTML = `
      <style>${styles}</style>
      <div class="drawer">
        <div class="drawer--progress">
          <svg viewBox="0 0 54 54">
            <circle
              cx="27"
              cy="27"
              r="25"
              stroke="var(--done)"
              stroke-width="2"
              fill="none"
              stroke-dasharray="${CIRCLE_IN_USER_POINTS}"
              stroke-dashoffset="var(--dash-offset)"
            ></circle>
          </svg>
          <button class="drawer--play" type="button">
            <svg viewBox="0 0 26 26" fill="var(--text)">
              <path d="M22.7156 13.5209C23.0948 13.2803 23.0948 12.7197 22.7156 12.4791L7.92561 3.09434C7.52268 2.83866 7 3.13278 7 3.61521V22.3848C7 22.8672 7.52268 23.1614 7.92561 22.9057L22.7156 13.5209Z"/>
            </svg>
          </button>
          <button class="drawer--pause" type="button">
            <svg viewBox="0 0 26 26" fill="var(--text)">
              <path d="M19.1667 3H15.8333C15.4167 3 15 3.47619 15 3.95238V22.0476C15 22.5238 15.4167 23 15.8333 23H19.1667C19.5833 23 20 22.5238 20 22.0476V3.95238C20 3.47619 19.5833 3 19.1667 3Z"/>
              <path d="M10.1667 3H6.83333C6.41667 3 6 3.47619 6 3.95238V22.0476C6 22.5238 6.41667 23 6.83333 23H10.1667C10.5833 23 11 22.5238 11 22.0476V3.95238C11 3.47619 10.5833 3 10.1667 3Z"/>
            </svg>
          </button>
          <button class="drawer--play-again" type="button">
            <svg viewBox="0 0 26 26" fill="var(--text)">
              <path d="M21.57 15.953C20.55 20.006 17.0667 23 12.9369 23C8.00901 23 4 18.7386 4 13.4998C4 8.26105 8.0087 4 12.9369 4C15.1891 4 17.2479 4.89151 18.8207 6.35846L17.4186 8.94031C16.2877 7.68485 14.6973 6.90044 12.9365 6.90044C9.51348 6.90044 6.72867 9.861 6.72867 13.4996C6.72867 17.1385 9.51337 20.0988 12.9365 20.0988C15.5442 20.0988 17.7804 18.3798 18.698 15.9525H16.5631L20.2816 9.10676L24 15.953H21.57Z"/>
            </svg>
          </button>
        </div>
        <h3>${this.trackData.title}</h3>
      </div>
      <div class="progress">
        <div class="progress--bar">
          <div class="progress--bar-completed"></div>
        </div>
        <div class="progress--handle"></div>
        <div class="progress--time-start"></div>
        <div class="progress--time-end">${secondsToTimecode(this.trackDuration)}</div>
      </div>
      <div class="control-buttons-container">
        <button class="rewind" type="button">
          <svg viewBox="0 0 57 57" fill="var(--text)">
            <path d="M24.9203 29.7431C24.3516 29.345 24.3516 28.5027 24.9203 28.1046L45.9265 13.4003C46.5893 12.9363 47.5 13.4105 47.5 14.2195V43.6282C47.5 44.4372 46.5893 44.9113 45.9265 44.4474L24.9203 29.7431Z"/>
            <path d="M8.29533 29.7431C7.72662 29.345 7.72661 28.5027 8.29533 28.1046L29.3015 13.4003C29.9643 12.9363 30.875 13.4105 30.875 14.2195V43.6282C30.875 44.4372 29.9643 44.9113 29.3015 44.4474L8.29533 29.7431Z"/>
          </svg>
        </button>
        <button class="play" type="button">
          <svg viewBox="0 0 41 41" fill="var(--text)">
            <path d="M34.5183 21.348C35.145 20.9563 35.145 20.0437 34.5183 19.652L10.0717 4.37291C9.4057 3.95663 8.54175 4.43548 8.54175 5.22091V35.7791C8.54175 36.5645 9.4057 37.0434 10.0717 36.6271L34.5183 21.348Z"/>
          </svg>
        </button>
        <button class="pause" type="button">
          <svg viewBox="0 0 20 23" fill="var(--text)">
            <rect width="7.5" height="22.5" rx="2"/>
            <rect x="12.5" width="7.5" height="22.5" rx="2"/>
          </svg>
        </button>
        <button class="play-again" type="button">
          <svg viewBox="0 0 40 40" fill="var(--text)">
            <path d="M33.1846 24.5431C31.6154 30.7785 26.2564 35.3846 19.9029 35.3846C12.3216 35.3846 6.15387 28.8286 6.15387 20.769C6.15387 12.7093 12.3211 6.15384 19.9029 6.15384C23.3679 6.15384 26.5353 7.52539 28.9549 9.78223L26.7979 13.7543C25.0579 11.8228 22.6113 10.6161 19.9024 10.6161C14.6361 10.6161 10.3518 15.1708 10.3518 20.7686C10.3518 26.3668 14.636 30.9212 19.9024 30.9212C23.9142 30.9212 27.3545 28.2766 28.7662 24.5423H25.4817L31.2026 14.0104L36.9231 24.5431H33.1846Z"/>
          </svg>
        </button>
        <button class="fast-forward" type="button">
          <svg viewBox="0 0 57 57" fill="var(--text)">
            <path d="M32.0797 29.7431C32.6484 29.345 32.6484 28.5027 32.0797 28.1046L11.0735 13.4003C10.4107 12.9363 9.5 13.4105 9.5 14.2195V43.6282C9.5 44.4372 10.4107 44.9113 11.0735 44.4474L32.0797 29.7431Z"/>
            <path d="M48.7047 29.7431C49.2734 29.345 49.2734 28.5027 48.7047 28.1046L27.6985 13.4003C27.0357 12.9363 26.125 13.4105 26.125 14.2195V43.6282C26.125 44.4372 27.0357 44.9113 27.6985 44.4474L48.7047 29.7431Z"/>
          </svg>
        </button>
      </div>
    `;
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  static get observedAttributes() {
    return ['current-time', 'disabled'];
  }

  get currentTime() {
    return Number(this.getAttribute('current-time'));
  }

  set currentTime(currentTime) {
    this.setAttribute('current-time', currentTime);
  }

  get state() {
    return this.getAttribute('state');
  }

  set state(state) {
    this.setAttribute('state', state);
  }

  get disabled() {
    return this.getAttribute('disabled');
  }

  set disabled(disabled) {
    this.setAttribute('disabled', disabled);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'current-time') {
      // Обновляет элементы UI в соответствии с продвижением по аудиозаписи.
      const newTime = Number(newValue);
      this.shadowRoot.querySelector('.progress--time-start').innerText = secondsToTimecode(newTime);
      const progress = `${(newTime / this.trackDuration) * 100}%`;
      this.style.setProperty('--progress', progress);
      const dashOffset = CIRCLE_IN_USER_POINTS * (1 - newTime / this.trackDuration);
      this.style.setProperty('--dash-offset', dashOffset);
      if ('mediaSession' in navigator && this.audioElement.duration) this.updatePositionState();
    }
    else if (name === 'disabled' && newValue === 'true') {
      if (this.state === 'playing' || this.state === 'paused') {
        // Переводит элементы UI в "спящий режим" при отключении (disable) компонента.
        this.state = 'paused';
        this.audioElement.pause();
        this.removeProgressBarAttachmentToAudioElement();
        if ('mediaSession' in navigator) {
          navigator.mediaSession.metadata = null;
          navigator.mediaSession.playbackState = 'none';
        }
        const handle = this.shadowRoot.querySelector('.progress--handle');
        const event = new Event('touchcancel');
        handle.dispatchEvent(event);
      }
    }
  }

  connectedCallback() {
    this.setAttributesInitially();
    this.setEventHandlers();
  }

  /**
   * Приводит состояние компонента в соответствие с его состоянием
   * при последнем использовании приложения.
   */
  setAttributesInitially() {
    this.disabled = 'false';
    const { timestop, isActive } = window.$globalStorage
      .storageManager.getTimestopAndIsActive(this.trackId);
    this.currentTime = timestop ?? 0;
    if (isActive) {
      this.state = 'paused';
      this.audioElement.src = this.trackData.audio;
      this.audioElement.currentTime = this.currentTime;
      this.audioElement.onended = this.audioEndedHandler.bind(this);
      this.trackPlayerParent.classList.add('track-player__active');
    }
    else this.state = 'ready';
  }

  setEventHandlers() {
    const eventHandlers = [
      ['.progress--handle', 'touchstart', this.handleTouchStartHandler],
      ['.progress--handle', 'touchmove', this.handleTouchMoveHandler],
      ['.progress--handle', 'touchcancel', this.handleTouchCancelHandler],
      ['.progress--handle', 'touchend', this.handleTouchEndHandler],
      ['.play', 'click', this.playClickHandler],
      ['.pause', 'click', this.pauseClickHandler],
      ['.play-again', 'click', this.playAgainClickHandler],
      ['.rewind', 'click', this.rewindClickHandler],
      ['.fast-forward', 'click', this.fastForwardClickHandler],
      ['.drawer--play', 'click', this.playClickHandler],
      ['.drawer--pause', 'click', this.pauseClickHandler],
      ['.drawer--play-again', 'click', this.playAgainClickHandler],
      ['.drawer', 'touchstart', this.drawerTouchStartHandler],
      ['.drawer', 'touchmove', this.drawerTouchMoveHandler],
      ['.drawer', 'touchcancel', this.drawerTouchCancelHandler],
      ['.drawer', 'touchend', this.drawerTouchEndHandler]
    ];

    eventHandlers.forEach(([selector, event, handler]) => {
      this.shadowRoot.querySelector(selector).addEventListener(event, handler.bind(this));
    });
  }

  handleTouchStartHandler(e) {
    if (this.state === 'ready') return;
    if (this.disabled === 'true') {
      disabledClickHandler();
      return;
    }
    this.removeProgressBarAttachmentToAudioElement();
    e.stopPropagation();
  }

  // eslint-disable-next-line jsdoc/require-param
  /**
   * Меняет атрибут current-time в зависимости от положения ручки при ее перетаскивании.
   * При выходе за границы progress-bar'а оставляет крайнее значение атрибута.
   */
  handleTouchMoveHandler(e) {
    if (this.disabled === 'true') return;
    if (this.state === 'ready') return;
    const progressElement = this.shadowRoot.querySelector('.progress');
    const leftLimit = progressElement.offsetLeft;
    const progressWidth = progressElement.offsetWidth;
    const rightLimit = leftLimit + progressWidth;

    let { clientX } = e.targetTouches[0];
    if (clientX < leftLimit) clientX = leftLimit;
    else if (clientX > rightLimit) clientX = rightLimit;
    const offsetX = clientX - leftLimit;
    const currentTime = (offsetX / progressWidth) * this.trackDuration;
    this.currentTime = currentTime;
    e.stopPropagation();
  }

  handleTouchCancelHandler(e) {
    if (this.state === 'ready') return;
    this.currentTime = this.audioElement.currentTime;
    if (this.state === 'playing') this.attachProgressBarToAudioElement();
    e.stopPropagation();
  }

  handleTouchEndHandler(e) {
    if (this.disabled === 'true') return;
    if (this.state === 'ready') return;
    // Если ручка была перетащена до конца
    if (this.currentTime === this.trackDuration) {
      this.audioElement.currentTime = this.trackDuration;
      this.state = 'ended';
    }
    else {
      this.audioElement.currentTime = this.currentTime;
      if (this.state === 'playing') this.attachProgressBarToAudioElement();
      else if (this.state === 'ended') this.state = 'paused';
    }
    e.stopPropagation();
  }

  updatePositionState() {
    if ('setPositionState' in navigator.mediaSession) {
      navigator.mediaSession.setPositionState({
        duration: this.audioElement.duration,
        playbackRate: this.audioElement.playbackRate,
        position: this.audioElement.currentTime
      });
    }
  }

  async playClickHandler() {
    if (this.disabled === 'true') {
      disabledClickHandler();
      return;
    }
    // Если компонент был неактивен, то завершить "сессию" предыдущего компонента и начать новую.
    if (this.state === 'ready') {
      const previousActiveComponent = document.querySelector('.track-player__active');
      if (previousActiveComponent) {
        previousActiveComponent.classList.remove('track-player__active');
        const previousActiveControlsComponent = previousActiveComponent.shadowRoot.querySelector('track-controls');
        if (previousActiveControlsComponent.state === 'ended') {
          previousActiveControlsComponent.currentTime = 0;
        }
        previousActiveControlsComponent.state = 'ready';
        previousActiveControlsComponent.removeProgressBarAttachmentToAudioElement();
      }
      this.audioElement.src = this.trackData.audio;
      this.audioElement.currentTime = this.currentTime;
      this.audioElement.onended = this.audioEndedHandler.bind(this);
      this.trackPlayerParent.classList.add('track-player__active');
    }
    this.state = 'playing';
    await this.audioElement.play();
    this.attachProgressBarToAudioElement();

    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'playing';
      navigator.mediaSession.metadata = new MediaMetadata({
        title: this.trackData.title.replace('&nbsp;', ' '),
        artist: 'Радио Кижи',
        artwork: this.trackData.icons
      });
      navigator.mediaSession.setActionHandler('play', async () => {
        await this.audioElement.play();
        this.state = 'playing';
        navigator.mediaSession.playbackState = 'playing';
        this.attachProgressBarToAudioElement();
      });
      navigator.mediaSession.setActionHandler('pause', this.pauseClickHandler.bind(this));
      navigator.mediaSession.setActionHandler('stop', this.stopClickHandler.bind(this));
      navigator.mediaSession.setActionHandler('seekbackward', this.rewindClickHandler.bind(this));
      navigator.mediaSession.setActionHandler('seekforward', this.fastForwardClickHandler.bind(this));
      this.updatePositionState();
    }
  }

  pauseClickHandler() {
    if (this.disabled === 'true') {
      disabledClickHandler();
      return;
    }
    this.state = 'paused';
    this.audioElement.pause();
    this.removeProgressBarAttachmentToAudioElement();
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'paused';
    }
  }

  async playAgainClickHandler() {
    if (this.disabled === 'true') {
      disabledClickHandler();
      return;
    }
    this.audioElement.load();
    this.currentTime = 0;
    this.audioElement.currentTime = 0;
    await this.playClickHandler();
  }

  rewindClickHandler() {
    if (this.state === 'ready') return;
    if (this.disabled === 'true') {
      disabledClickHandler();
      return;
    }
    if (this.state === 'ended') this.state = 'paused';
    this.audioElement.currentTime = Math
      .max(this.audioElement.currentTime - SEEK_BACKWARDS_STEP, 0);
    this.currentTime = this.audioElement.currentTime;
  }

  fastForwardClickHandler() {
    if (this.state === 'ready' || this.state === 'ended') return;
    if (this.disabled === 'true') {
      disabledClickHandler();
      return;
    }
    /**
     * Если после нажатия происходит выход за пределы длительности аудиозаписи -
     * поменять состояние компонента.
     */
    if (this.currentTime + SEEK_FORWARDS_STEP >= this.trackDuration) {
      this.removeProgressBarAttachmentToAudioElement();
      this.audioElement.currentTime = this.trackDuration;
      this.state = 'ended';
      this.currentTime = this.trackDuration;
    }
    else {
      this.audioElement.currentTime += SEEK_FORWARDS_STEP;
      this.currentTime = this.audioElement.currentTime;
    }
  }

  stopClickHandler() {
    this.removeProgressBarAttachmentToAudioElement();
    this.audioElement.src = '';
    this.currentTime = 0;
    this.state = 'ready';
    this.trackPlayerParent.classList.remove('track-player__active');
    navigator.mediaSession.playbackState = 'none';
    navigator.mediaSession.metadata = null;
  }

  audioEndedHandler() {
    this.state = 'ended';
    this.removeProgressBarAttachmentToAudioElement();
    this.currentTime = this.trackDuration;
  }

  drawerTouchStartHandler(e) {
    this.trackPlayerParent.classList.add('track-player__dragged');
    e.stopPropagation();
  }

  drawerTouchMoveHandler(e) {
    const { clientY } = e.targetTouches[0];
    const drawerHeight = this.shadowRoot.querySelector('.drawer').clientHeight;
    /**
     * Двигать элемент можно только вверх относительно начального положения.
     * e.stopPropagation нужен, чтобы правильно работало перетаскивание
     * родительского компонента track-player.
     */
    const newTrackPlayerTop = clientY + (drawerHeight / 2);
    if (newTrackPlayerTop < window.innerHeight)
      this.trackPlayerParent.style.top = `${newTrackPlayerTop}px`;
    e.stopPropagation();
  }

  drawerTouchCancelHandler(e) {
    this.trackPlayerParent.classList.remove('track-player__dragged');
    this.trackPlayerParent.style.top = '';
    e.stopPropagation();
  }

  drawerTouchEndHandler(e) {
    this.trackPlayerParent.classList.remove('track-player__dragged');
    const { clientY } = e.changedTouches[0];
    if ((window.innerHeight - clientY) > DRAWER_TOUCHEND_BOUNDS) {
      this.trackPlayerParent.show();
    }
    else this.trackPlayerParent.unshow();
    this.trackPlayerParent.style.top = '';
    this.drawerLastClientY = null;
    e.stopPropagation();
  }

  attachProgressBarToAudioElement() {
    this.intervalId = setInterval(() => {
      this.currentTime = this.audioElement.currentTime;
    }, TIMER_UPDATE_FREQUENCY);
  }

  removeProgressBarAttachmentToAudioElement() {
    clearInterval(this.intervalId);
    this.intervalId = null;
  }
}
