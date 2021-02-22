export function deleteLike (context, visualization) {
  const currentLikeStatus = visualization.liked;

  context.dispatch('updateVisualization', {
    visualizationId: visualization.id,
    visualizationAttributes: {
      liked: false
    }
  });

  context.rootState.client.deleteLike(visualization.id,
    function (err, _, data) {
      if (err) {
        context.dispatch('updateVisualization', {
          visualizationId: visualization.id,
          visualizationAttributes: {
            liked: currentLikeStatus
          }
        });
        return;
      }

      context.commit('updateNumberLikes', {
        visualizationId: visualization.id,
        visualizationAttributes: {
          liked: data.liked
        }
      });
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

export function whenFetchVisualizations (context, params) {
  return new Promise((resolve, reject) => {
    context.rootState.client.getVisualization('', params, function (err, _, data) {
      if (err) {
        context.commit('setRequestError', err);
        return reject(err);
      }
      resolve(data);
    });
  });
}

export function filter (context, filter) {
  context.commit('setPagination', 1);
  context.commit('setFilterType', filter);
  context.dispatch('fetch');
}

export function like (context, visualization) {
  const currentLikeStatus = visualization.liked;

  context.dispatch('updateVisualization', {
    visualizationId: visualization.id,
    visualizationAttributes: {
      liked: true
    }
  });

  context.rootState.client.like(visualization.id,
    function (err, _, data) {
      if (err) {
        context.dispatch('updateVisualization', {
          visualizationId: visualization.id,
          visualizationAttributes: {
            liked: currentLikeStatus
          }
        });

        return;
      }

      context.commit('updateNumberLikes', {
        visualizationId: visualization.id,
        visualizationAttributes: {
          liked: data.liked
        }
      });
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
  context.commit('setResultsPerPage', options.per_page);
  context.commit('setQueryFilter', options.q);
  context.dispatch('fetch');
}

export function updateVisualization (context, visualizationOptions) {
  context.commit('maps/updateVisualization', visualizationOptions, { root: true });
  context.commit('datasets/updateVisualization', visualizationOptions, { root: true });
  context.commit('recentContent/updateVisualization', visualizationOptions, { root: true });
  context.commit('search/updateVisualization', visualizationOptions, { root: true });
}

export function createVisualizationFromDataset (context, tables) {
  const path = ['api/v1/viz'];
  const opts = {
    dataType: 'json',
    data: JSON.stringify({
      name: 'Untitled Map',
      type: 'derived',
      tables: tables,
      transition_options: { time: 0 }
    })
  };
  return new Promise((resolve, reject) => {
    context.rootState.client.post([path], opts, (err, _, data) => {
      if (err) {
        resolve(false);
      } else {
        resolve(data.id);
      }
    });
  });
}
