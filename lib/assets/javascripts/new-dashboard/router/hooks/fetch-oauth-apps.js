import store from 'new-dashboard/store';

export function fetchOAuthApps (_1, _2, next) {
  store.dispatch('oAuthApps/fetch', {
    baseUrl: store.state.user.base_url,
    userId: store.state.user.id,
    apiKey: store.state.user.api_key
  });
  next();
}

export function fetchIfAppNotFound (to, _, next) {
  const appId = to.params.id;
  const storeApp = store.state.oAuthApps.list[appId];

  if (storeApp) {
    next();
    return;
  }

  fetchOAuthApps.apply(this, arguments);
}
