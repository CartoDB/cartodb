export function fetch (fetchFunctionName) {
  return function (context) {
    const { api_key: apiKey } = context.rootState.user;
    context.commit('setFetchingState');

    context.rootState.client[fetchFunctionName](apiKey, function (err, _, data) {
      if (err) {
        const error = data.responseJSON && data.responseJSON.errors ||
          { message: data.responseText || data.statusText };
        context.commit('setRequestError', error);
        return;
      }

      context.commit('setApps', data.result);
    });
  };
}

export function createOAuth (context, app) {
  const { api_key: apiKey } = context.rootState.user;

  return new Promise((resolve, reject) => {
    context.rootState.client.createApp(apiKey, app, function (err, _, data) {
      if (err) {
        const error = data.responseJSON && data.responseJSON.errors ||
          { message: data.responseText || data.statusText };
        return reject(error);
      }

      context.commit('addApp', data);
      resolve(data);
    });
  });
}

export function updateOAuth (context, app) {
  const { api_key: apiKey } = context.rootState.user;

  return new Promise((resolve, reject) => {
    context.rootState.client.updateApp(apiKey, app, function (err, _, data) {
      if (err) {
        const error = data.responseJSON && data.responseJSON.errors ||
          { message: data.responseText || data.statusText };
        return reject(error);
      }

      context.commit('updateOAuthApp', data);
      resolve(data);
    });
  });
}

export function regenerateCredentials (context, app) {
  const { api_key: apiKey } = context.rootState.user;

  context.rootState.client.regenerateClientSecret(apiKey, app, function (err, _, data) {
    if (err) {
      context.commit('setRequestError', [data.responseText]);
      return;
    }

    context.commit('updateOAuthApp', data);
  });
}
