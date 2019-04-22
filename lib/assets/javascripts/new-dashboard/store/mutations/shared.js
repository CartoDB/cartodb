export function setFetchingState (state) {
  state.isFetching = true;
  state.isErrored = false;
  state.error = {};
}

export function setPagination (state, page = 1) {
  state.page = page;
  state.numPages = Math.ceil(state.metadata.total_entries / state.resultsPerPage) || 1;
}

export function setResultsPerPage (state, resultsPerPage = 12) {
  state.resultsPerPage = resultsPerPage;
}

export function setRequestError (state, error) {
  state.isFetching = false;
  state.isErrored = true;
  state.error = error;
}
