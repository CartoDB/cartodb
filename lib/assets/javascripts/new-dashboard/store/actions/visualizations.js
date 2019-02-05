export function fetchVisualizations (context, parameters) {
  context.commit('setFetchingState');

  context.rootState.client.getVisualization('',
    parameters,
    function (err, _, data) {
      if (err) {
        context.commit('setRequestError', err);
        return;
      }
      context.commit('setVisualizations', data);
      context.commit('setPagination', context.state.page);
    });
}

export function like (context, visualization) {
  const currentLikeStatus = visualization.liked;

  context.commit('updateLike', { visualizationId: visualization.id, liked: true });

  context.rootState.client.like(visualization.id,
    function (err, _, data) {
      if (err) {
        context.commit('updateLike', { visualizationId: visualization.id, liked: currentLikeStatus });
        return;
      }

      context.commit('updateNumberLikes', { visualizationId: visualization.id, likes: data.likes });
    }
  );
}

export function deleteLike (context, visualization) {
  const currentLikeStatus = visualization.liked;

  context.commit('updateLike', { visualizationId: visualization.id, liked: false });

  context.rootState.client.deleteLike(visualization.id,
    function (err, _, data) {
      if (err) {
        context.commit('updateLike', { visualizationId: visualization.id, liked: currentLikeStatus });
        return;
      }
      context.commit('updateNumberLikes', { visualizationId: visualization.id, likes: data.likes });
    }
  );
}

export function updateVisualization (context, visualizationOptions) {
  context.commit('updateVisualizationGlobally', visualizationOptions, { root: true });
}
