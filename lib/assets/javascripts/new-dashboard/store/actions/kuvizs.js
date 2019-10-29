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

export function deleteKuviz (context, kuviz) {
  const { api_key: apiKey } = context.rootState.user;

  const CONFIG_PATH = [`api/v4/kuviz/${kuviz.id}?api_key=${apiKey}`];
  const opts = {
    dataType: 'json'
  };
  return new Promise((resolve, reject) => {
    context.rootState.client.delete([CONFIG_PATH], opts, function (err, _, data) {
      if (err) {
        const error = data.responseJSON && data.responseJSON.errors ||
          { message: data.responseText || data.statusText };
        context.commit('setRequestError', error);
        return reject(error);
      }
      return resolve();
    });
  });
}
