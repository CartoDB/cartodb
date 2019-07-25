const apps = {
  namespaced: true,
  state: {
    isFetching: false,
    isErrored: false,
    error: {},
    apps: []
  },
  computed: {},
  getters: {},
  mutations: {
    setApps (state, apps) {
      state.apps = apps;
      state.isFetching = false;
      state.isErrored = false;
      state.error = [];
    },

    setRequestError (state, error) {
      state.isFetching = false;
      state.isErrored = true;
      state.error = error;
      state.apps = [];
    },

    setFetchingState (state) {
      state.isFetching = true;
      state.isErrored = false;
      state.error = [];
      state.apps = [];
    }
  },
  actions: {
    fetch (context, options) {
      context.commit('setFetchingState');
      const { apiKey } = options;

      context.rootState.client.getOAuthApps(apiKey, function (err, _, data) {
        if (err) {
          context.commit('setRequestError', err);
          return;
        }
        context.commit('setApps', data.result);
      });
    },

    create (context, options) {
      const { apiKey, app } = options;

      context.rootState.client.createApp(apiKey, app, function (err, _, data) {

        if (err) {
          context.commit('setRequestError', data.responseJSON.errors);
          return;
        }
        context.commit('setApps', data.result);
      });
    }
  }
};

export default apps;
