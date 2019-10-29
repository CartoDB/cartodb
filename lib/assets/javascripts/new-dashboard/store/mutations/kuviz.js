import toObject from 'new-dashboard/utils/to-object';

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

export function setVisualizations (state, visualizationsData) {
  state.list = toObject(visualizationsData.visualizations, 'id');
  state.metadata = {
    total_entries: visualizationsData.total_entries,
    total_likes: visualizationsData.total_likes,
    total_shared: visualizationsData.total_shared,
    total_locked: visualizationsData.total_locked,
    total_user_entries: visualizationsData.total_user_entries
  };

  state.isFetching = false;
}

export function updateVisualization (state, {visualizationId, visualizationAttributes}) {
  const isVisualizationPresent = state.list.hasOwnProperty(visualizationId);

  if (isVisualizationPresent) {
    Object.assign(state.list[visualizationId], visualizationAttributes);
  }
}
