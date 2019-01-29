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
