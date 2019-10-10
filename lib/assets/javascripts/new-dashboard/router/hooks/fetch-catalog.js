import store from 'new-dashboard/store';

export default function fetchCatalog (_1, _2, next) {
  store.dispatch('catalog/fetch', {
    apiKey: store.state.user.api_key
  });
  next();
}
