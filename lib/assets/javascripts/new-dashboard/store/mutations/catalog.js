import { setUrlParameters } from 'new-dashboard/utils/catalog/url-parameters';

export function setCurrentAccessPlatform (state, platform) {
  state.currentAccessPlatform = platform;
}

export function setCurrentSubscription (state, subscription) {
  state.currentSubscription = subscription;
}

export function setFetchingState (state) {
  state.isFetching = true;
  state.hasError = false;
}

export function setDatasetsList (state, data) {
  state.datasetsList = data;
  state.isFetching = false;
  state.hasError = false;
}

export function setDataset (state, data) {
  state.dataset = data;
  state.isFetching = false;
  state.hasError = false;
}

export function setKeyVariables (state, data) {
  state.keyVariables = data;
  state.hasError = false;
}

export function setVariables (state, data) {
  state.variables = data;
  state.hasError = false;
}

export function setAvailableFilters (state, { id, options }) {
  // Filter options to highlight (handmade so far)
  const highlightedFilter = {
    glo: true
  };

  // Set filter options
  const filtersMap = options.reduce((acum, elem) => {
    elem.highlighted = highlightedFilter[elem.id] || false;
    acum.set(elem.id, elem);
    return acum;
  }, new Map());
  state.filtersAvailable = { ...state.filtersAvailable, [id]: filtersMap };

  // Init filters if needed
  if (!state.filter.categories[id]) {
    state.filter.categories[id] = [];
  }
}

export function setFilter (state, filter) {
  const newFilter = Object.assign({ ...state.filter.categories }, filter);
  state.filter.categories = newFilter;
  if (!filter.page) {
    state.filter.page = 0;
  }
  setUrlParameters(state);
}

export function removeFilter (state, filter) {
  state.filter.categories[filter.id] = state.filter.categories[filter.id].filter(f => f.id !== filter.value.id);
  state.filter.page = 0;
  setUrlParameters(state);
}

export function setSearchText (state, searchText) {
  state.filter.searchText = searchText;
  setUrlParameters(state);
}

export function setPage (state, page) {
  state.filter.page = page;
  setUrlParameters(state);
}

export function setDatasetsListCount (state, count) {
  state.datasetsListCount = count;
}

export function resetTagFilters (state) {
  for (let category in state.filter.categories) {
    state.filter.categories[category] = [];
  }
  state.filter.page = 0;
  setUrlParameters(state);
}

export function resetDatasetsList (state) {
  state.datasetsList = [];
  state.datasetsListCount = 0;
}

export function resetDataset (state) {
  state.dataset = {};
  state.keyVariables = {};
  state.variables = {};
}

export function setSubscriptionsList (state, data) {
  state.subscriptionsList = data;
}

export function setSubscriptionInfo (state, data) {
  state.subscriptionInfo = data;
}

export function setRequestError (state, error) {
  state.requestError = error;
}

export function resetSubscriptionsList (state) {
  state.subscriptionsList = [];
}

export function addInterestedSubscriptions (state, id) {
  state.interestedSubscriptions.push(id);
  localStorage.setItem(
    'interestedSubscriptions',
    state.interestedSubscriptions
  );
}
