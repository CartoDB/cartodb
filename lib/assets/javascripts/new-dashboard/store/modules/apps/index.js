import toObject from 'new-dashboard/utils/to-object';

const apps = {
  namespaced: true,
  state: {
    isFetching: false,
    isErrored: false,
    isLogoFetching: false,
    tempLogoUrl: '',
    error: [],
    connectedApps: {}
  },
  computed: {},
  getters: {},
  mutations: {
    setConnectedApps (state, apps) {
      state.connectedApps = toObject(apps, 'id');
      state.isFetching = false;
      state.isErrored = false;
      state.error = [];
    },

    createConnectedApps (state, app) {
      state.connectedApps[app.id] = app;
    },

    updateConnectedApp (state, app) {
      const isConnectedAppPresent = state.connectedApps.hasOwnProperty(app.id);

      if (isConnectedAppPresent) {
        Object.assign(state.connectedApps[app.id], app);
      }
    },

    setRequestError (state, error) {
      state.isFetching = false;
      state.isErrored = true;
      state.error = error;
      state.connectedApps = {};
    },

    setFetchingState (state) {
      state.isFetching = true;
      state.isErrored = false;
      state.error = [];
      state.apps = [];
    },

    setLogoFetchingState (state) {
      state.isLogoFetching = true;
    },

    setTempLogoUrl (state, tempLogoUrl) {
      state.tempLogoUrl = tempLogoUrl;
      state.isLogoFetching = false;
    }
  },
  actions: {
    fetch (context, options) {
      context.commit('setFetchingState');
      const { apiKey } = options;
      context.rootState.client.getOAuthApps(apiKey, function (err, _, data) {
        if (err) {
          context.commit('setRequestError', data.responseJSON.errors);
          return;
        }
        context.commit('setConnectedApps', data.result);
      });
    },
    create (context, options) {
      const { apiKey, app } = options;
      context.rootState.client.createApp(apiKey, app, function (err, _, data) {
        if (err) {
          context.commit('setRequestError', data.responseJSON.errors);
          return;
        }
        context.commit('createConnectedApps', data);
      });
    },
    update (context, options) {
      const { apiKey, app } = options;
      context.rootState.client.updateApp(apiKey, app, function (err, _, data) {
        if (err) {
          context.commit('setRequestError', data.responseJSON.errors);
          return;
        }

        context.commit('updateConnectedApp', data);
      });
    },
    delete (context, options) {
      const { apiKey, app } = options;
      context.rootState.client.deleteApp(apiKey, app, function (err, _, data) {
        if (err) {
          context.commit('setRequestError', data.responseJSON.errors);
        }
      });
    },
    regenerateClientSecret (context, options) {
      const { apiKey, app } = options;
      context.rootState.client.regenerateClientSecret(apiKey, app, function (err, _, data) {
        if (err) {
          context.commit('setRequestError', [data.responseText]);
          return;
        }
        context.commit('updateConnectedApp', data);
      });
    },
    uploadLogo (context, options) {
      context.commit('setLogoFetchingState');
      const { apiKey, userId, filename } = options;
      context.rootState.client.uploadLogo(apiKey, userId, filename, function (err, _, data) {
        if (err) {
          context.commit('setRequestError', data.responseJSON.errors);
          context.commit('setLogoFetchingState', false);
          return;
        }
        context.commit('setTempLogoUrl', data.public_url);
      });
    }
  }
};

export default apps;
