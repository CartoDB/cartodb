export function updateLike (state, {visualizationId, liked}) {
  state.list[visualizationId].liked = liked;
}

export function updateNumberLikes (state, {visualizationId, likes}) {
  state.list[visualizationId].likes = likes;
}

export function setVisualizationAttributes (state, {visualizationId, visualizationAttributes}) {
  Object.assign(state.list[visualizationId], visualizationAttributes);
}
