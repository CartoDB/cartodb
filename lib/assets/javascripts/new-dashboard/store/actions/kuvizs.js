export function fetchVisualizations (context, parameters) {
  context.commit('setFetchingState');
  const { api_key: apiKey } = context.rootState.user;

  const CONFIG_PATH = [`api/v4/kuviz?api_key=${apiKey}`];
  const opts = {
    dataType: 'json'
  };
  context.rootState.client.get([CONFIG_PATH], opts, function (err, _, data) {
    if (err) {
      const error = data.responseJSON && data.responseJSON.errors ||
        { message: data.responseText || data.statusText };
      context.commit('setRequestError', error);
      return;
    }
    context.commit('setVisualizations', data);
  });
}

export function updateVisualization (context, visualizationOptions) {
  context.commit('maps/updateVisualization', visualizationOptions, { root: true });
}
