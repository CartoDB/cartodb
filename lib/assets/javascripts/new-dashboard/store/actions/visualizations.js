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

export function filter (context, filter) {
  context.commit('setPagination', 1);
  context.commit('setFilterType', filter);
  context.dispatch('fetch');
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

export function order (context, orderOptions) {
  context.commit('setPagination', 1);
  context.commit('setOrder', orderOptions);
  context.dispatch('fetch');
}

export function resetFilters (DEFAULT_VALUES) {
  return function (context) {
    context.commit('setPagination', 1);
    context.commit('setFilterType', 'mine');
    context.commit('setResultsPerPage', 12);
    context.commit('setOrder', { order: DEFAULT_VALUES.order, direction: DEFAULT_VALUES.orderDirection });
  };
}

export function setResultsPerPage (context, perPage) {
  context.commit('setResultsPerPage', perPage);
}

export function setURLOptions (context, options) {
  context.commit('setPagination', parseInt(options.page || 1));
  context.commit('setFilterType', options.filter);
  context.commit('setOrder', { order: options.order, direction: options.order_direction });
  context.dispatch('fetch');
}

export function updateVisualization (context, visualizationOptions) {
  context.commit('updateVisualizationGlobally', visualizationOptions, { root: true });
}
