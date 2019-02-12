import toObject from 'new-dashboard/utils/to-object';

export function setFetchingState (state) {
  state.isFetching = true;
  state.isErrored = false;
  state.error = {};
}

export function setFilterType (state, filterType = 'mine') {
  state.filterType = filterType;
}

export function setPagination (state, page = 1) {
  state.page = page;
  state.numPages = Math.ceil(state.metadata.total_entries / state.resultsPerPage) || 1;
}

export function setOrder (DEFAULT_VALUES) {
  return function (state, orderOptions) {
    state.order = orderOptions.order || DEFAULT_VALUES.order;
    state.orderDirection = orderOptions.direction || DEFAULT_VALUES.orderDirection;
  };
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

export function updateLike (state, {visualizationId, liked}) {
  state.list[visualizationId].liked = liked;
}

export function updateNumberLikes (state, {visualizationId, likes}) {
  state.list[visualizationId].likes = likes;
}

export function updateVisualizationGlobally (state, {visualizationId, visualizationAttributes}) {
  const isVisualizationInMaps = state.maps.list.hasOwnProperty(visualizationId);
  if (isVisualizationInMaps) {
    Object.assign(state.maps.list[visualizationId], visualizationAttributes);
  }

  const isVisualizationInDatasets = state.datasets.list.hasOwnProperty(visualizationId);
  if (isVisualizationInDatasets) {
    Object.assign(state.datasets.list[visualizationId], visualizationAttributes);
  }

  const isVisualizationInRecentContent = state.recentContent.list.hasOwnProperty(visualizationId);
  if (isVisualizationInRecentContent) {
    Object.assign(state.recentContent.list[visualizationId], visualizationAttributes);
  }
}
