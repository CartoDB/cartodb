import store from 'new-dashboard/store';

export default function fetchNotifications (to, from, next) {
  store.dispatch('notifications/fetchNotifications', {
    baseUrl: store.state.user.base_url,
    userId: store.state.user.id,
    apiKey: store.state.user.api_key
  });
  next();
}
