import store from 'new-dashboard/store';
import { isAllowed } from 'new-dashboard/core/filters';

export default function checkNavigation (storeModule, redirectionRoute) {
  return function (to, _, next) {
    const urlOptions = { ...to.params, ...to.query };

    if (urlOptions.filter && !isAllowed(urlOptions.filter)) {
      return next({ name: redirectionRoute });
    }

    store.dispatch(`${storeModule}/setURLOptions`, urlOptions);
    next();
  };
}

export function filtersRouterGuard (redirectionRoute, storeModule, to, next) {
  const urlOptions = { ...to.params, ...to.query };

  if (urlOptions.filter && !isAllowed(urlOptions.filter)) {
    return next({ name: redirectionRoute });
  }

  store.dispatch(`${storeModule}/setURLOptions`, urlOptions);
  next();
}
