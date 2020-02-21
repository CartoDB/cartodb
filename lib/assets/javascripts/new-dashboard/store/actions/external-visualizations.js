export function fetchVisualizations (context, parameters) {
  context.commit('setFetchingState');

  context.rootState.customStorage.getVisualizations()
    .then(data => {
      context.commit('setExternalMaps', data);
      context.commit('setPagination', context.state.page);
    })
    .catch(err => {
      context.commit('setRequestError', err);
    });
}

export function deleteVisualization (context, parameters) {
  const { api_key: apiKey } = context.rootState.user;
  context.rootState.customStorage.setApiKey(apiKey);

  context.rootState.customStorage.deleteVisualization(parameters.visId)
    .then(() => {
      fetchVisualizations(context, null);
    })
    .catch((err) => {
      context.commit('setRequestError', err);
    });
}

export function filter (context, filter) {
  context.commit('setPagination', 1);
  context.commit('setFilterType', filter);
  context.dispatch('fetch');
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
