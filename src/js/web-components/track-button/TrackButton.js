import styles from './TrackButton.css';

export default class TrackButton extends HTMLElement {
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
    this.setAttribute('role', 'button');
    this.trackId = id;
    this.style.backgroundImage = `url(${image})`;
    const template = document.createElement('template');
    template.innerHTML = `
      <style>${styles}</style>
      <h2>${title}</h2>
    `;
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.addEventListener('click', this.clickHandler);
  }

  clickHandler() {
    const correspondingTrackPlayer = document.querySelector(`track-player[track-id="${this.trackId}"]`);
    correspondingTrackPlayer.show();
  }
}
