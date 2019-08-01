import toObject from 'new-dashboard/utils/to-object';

const connectedApps = {
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
    setConnectedApps (state, apps) {
      state.list = toObject(apps, 'id');
      state.isFetching = false;
      state.isErrored = false;
      state.error = [];
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
      context.rootState.client.getConnectedApps(apiKey, function (err, _, data) {
        if (err) {
          context.commit('setRequestError', data.responseJSON.errors);
          return;
        }
        context.commit('setConnectedApps', data.result);
      });
    },
    revoke (context, options) {
      const { apiKey, app } = options;
      return new Promise((resolve, reject) => {
        context.rootState.client.revokeOAuthApp(apiKey, app, function (err, _, data) {
          if (err) {
            return reject(data.responseJSON.errors);
          }
          resolve();
        });
      });
    }
  }
};

export default connectedApps;
