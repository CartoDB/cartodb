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
  // context.commit('datasets/updateVisualization', visualizationOptions, { root: true });
  // context.commit('recentContent/updateVisualization', visualizationOptions, { root: true });
  // context.commit('search/updateVisualization', visualizationOptions, { root: true });
}

// const app = '<html><h1>Hello Kuviz!</h1></html>';
// const opts = {
//   data: JSON.stringify({
//     name: 'First k',
//     data: btoa(app)
//   }),
//   dataType: 'json'
// };
// context.rootState.client.post([CONFIG_PATH], opts, function (err, _, data) {
//   if (err) {
//     return reject(err);
//   }
//   resolve();
// });
