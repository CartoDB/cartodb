import toObject from 'new-dashboard/utils/to-object';

const oAuthApps = {
  namespaced: true,
  state: {
    isFetching: false,
    isErrored: false,
    error: [],
    list: {}
  },
  computed: {},
  getters: {},
  mutations: {
    setOAuthApps (state, apps) {
      state.list = toObject(apps, 'id');
      state.isFetching = false;
      state.isErrored = false;
      state.error = [];
    },

    createOAuthApps (state, app) {
      state.list[app.id] = app;
    },

    updateOAuthApp (state, app) {
      const isOAuthAppPresent = state.list.hasOwnProperty(app.id);

      if (isOAuthAppPresent) {
        Object.assign(state.list[app.id], app);
      }
    },

    setRequestError (state, error) {
      state.isFetching = false;
      state.isErrored = true;
      state.error = error;
      state.list = {};
    },

    setFetchingState (state) {
      state.isFetching = true;
      state.isErrored = false;
      state.error = [];
      state.list = {};
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
        context.commit('setOAuthApps', data.result);
      });
    },
    create (context, options) {
      const { apiKey, app } = options;
      return new Promise((resolve, reject) => {
        context.rootState.client.createApp(apiKey, app, function (err, _, data) {
          if (err) {
            return reject(data.responseJSON.errors);
          }
          context.commit('createOAuthApps', data);
          resolve(data);
        });
      });
    },
    update (context, options) {
      const { apiKey, app } = options;
      return new Promise((resolve, reject) => {
        context.rootState.client.updateApp(apiKey, app, function (err, _, data) {
          if (err) {
            return reject(data.responseJSON.errors);
          }
          context.commit('updateOAuthApp', data);
          resolve(data);
        });
      });
    },
    delete (context, options) {
      const { apiKey, app } = options;
      return new Promise((resolve, reject) => {
        context.rootState.client.deleteApp(apiKey, app, function (err, _, data) {
          if (err) {
            return reject(data.responseJSON.errors);
          }
          resolve();
        });
      });
    },
    regenerateClientSecret (context, options) {
      const { apiKey, app } = options;
      context.rootState.client.regenerateClientSecret(apiKey, app, function (err, _, data) {
        if (err) {
          context.commit('setRequestError', [data.responseText]);
          return;
        }
        context.commit('updateOAuthApp', data);
      });
    },
    uploadLogo (context, options) {
      const { apiKey, userId, filename } = options;
      return new Promise((resolve, reject) => {
        context.rootState.client.uploadLogo(apiKey, userId, filename, function (err, _, data) {
          if (err) {
            return reject(data.responseJSON.error);
          }
          resolve(data.public_url);
        });
      });
    }
  }
};

export default oAuthApps;
