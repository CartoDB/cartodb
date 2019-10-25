export function setCategories (state, data) {
  state.categories = data.map(c => c.category);
  state.isFetching = false;
  state.isErrored = false;
  state.error = [];
}

export function setCountries (state, data) {
  state.countries = data.map(c => c.country);
  state.isFetching = false;
  state.isErrored = false;
  state.error = [];
}

export function setDatasets (state, datasets) {
  state.list = datasets;
  state.isFetching = false;
  state.isErrored = false;
  state.error = [];
  state.numResults = datasets.length;
}

export function setRequestError (state, error) {
  state.isFetching = false;
  state.isErrored = true;
  state.error = error;
  state.list = {};
  state.numResults = 0;
}

export function setFetchingState (state) {
  state.isFetching = true;
  state.isErrored = false;
  state.error = [];
  state.list = {};
}

export function setPagination (state, page = 1) {
  state.page = page;
  state.numPages = Math.ceil(state.numResults / state.resultsPerPage) || 1;
}

export function setResultsPerPage (state, resultsPerPage = 12) {
  state.resultsPerPage = resultsPerPage;
}

export function setOrder (DEFAULT_VALUES) {
  return function (state, orderOptions) {
    state.order = orderOptions.order || DEFAULT_VALUES.order;
    state.orderDirection = orderOptions.direction || DEFAULT_VALUES.orderDirection;
  };
}

export function orderDatasets (state) {
  const orderAsc = (list, order) => {
    list.sort((a, b) => (a[order] > b[order]) ? 1 : -1);
  };
  const orderDesc = (list, order) => {
    list.sort((a, b) => (a[order] < b[order]) ? 1 : -1);
  };

  const orderByDirection = {
    'asc': () => orderAsc(state.list, state.order),
    'desc': () => orderDesc(state.list, state.order)
  };
  return orderByDirection[state.orderDirection]();
}
