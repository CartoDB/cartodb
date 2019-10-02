import store from 'new-dashboard/store';

export default function fetchLDS (_1, _2, next) {
  store.dispatch('lds/fetch', {
    apiKey: store.state.user.api_key
  });
  next();
}
