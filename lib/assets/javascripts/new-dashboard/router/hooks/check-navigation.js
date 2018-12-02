import store from 'new-dashboard/store';
import { isAllowed } from 'new-dashboard/core/filters';

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
