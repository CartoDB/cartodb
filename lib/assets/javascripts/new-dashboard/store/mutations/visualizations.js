import toObject from 'new-dashboard/utils/to-object';

export function setFilterType (state, filterType = 'mine') {
  state.filterType = filterType;
}

export function setOrder (DEFAULT_VALUES) {
  return function (state, orderOptions) {
    state.order = orderOptions.order || DEFAULT_VALUES.order;
    state.orderDirection = orderOptions.direction || DEFAULT_VALUES.orderDirection;
  };
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

export function updateNumberLikes (state, {visualizationAttributes}) {
  state.metadata.total_likes += visualizationAttributes.liked ? 1 : -1;
}

export function updateVisualization (state, {visualizationId, visualizationAttributes}) {
  const isVisualizationPresent = state.list.hasOwnProperty(visualizationId);

  if (isVisualizationPresent) {
    Object.assign(state.list[visualizationId], visualizationAttributes);
  }
}
