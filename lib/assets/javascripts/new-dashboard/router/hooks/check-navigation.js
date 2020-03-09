import store from 'new-dashboard/store';
import { isAllowed } from 'new-dashboard/core/configuration/filters';

export default function checkNavigation (storeModule, redirectionRoute) {
  return checkFilters.bind(this, storeModule, redirectionRoute);
}

export function checkFilters (redirectionRoute, storeModule, to, _, next) {
  const urlOptions = { ...to.params, ...to.query };

  if (urlOptions.filter && !isAllowed(urlOptions.filter)) {
    return next({ name: redirectionRoute });
  }

  store.dispatch(`${storeModule}/setURLOptions`, urlOptions);
  next();
}

export function mapsBeforeEnter (to, from, next) {
  store.dispatch('maps/resetFilters');
  checkFilters('maps', 'maps', to, from, next);
}

export function externalMapsBeforeEnter (to, from, next) {
  store.dispatch('externalMaps/init')
    .then(() => {
      store.dispatch('externalMaps/resetFilters');
      checkFilters('externalMaps', 'externalMaps', to, from, next);
    });
}

export function datasetsBeforeEnter (to, from, next) {
  store.dispatch('datasets/resetFilters');
  checkFilters('datasets', 'datasets', to, from, next);
}

export function catalogueDetailBeforeEnter (to, from, next) {
  if (to.query.category && to.query.country) {
    store.dispatch('catalogue/fetchDatasets', {
      category: to.query.category,
      country: to.query.country
    });
    next();
  } else {
    next({ name: 'catalogue' });
  }
}
