import store from 'new-dashboard/store';

export default function fetchApps (to, from, next) {
  store.dispatch('apps/fetch', {
    baseUrl: store.state.user.base_url,
    userId: store.state.user.id,
    apiKey: store.state.user.api_key
  });
  next();
}
