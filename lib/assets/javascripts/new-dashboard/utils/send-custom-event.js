import store from '../store';

export default function sendCustomEvent (eventName, params) {
  const tagManagerId = store.state.config.google_tag_manager_id;

  if (tagManagerId) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      'event': eventName,
      ...params
    });
  }
}
