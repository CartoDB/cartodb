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

    // createOAuthApps (state, app) {
    //   state.oAuthApps[app.id] = app;
    // },

    updateConnectedApp (state, app) {
      const isConnectedAppPresent = state.list.hasOwnProperty(app.id);

      if (isConnectedAppPresent) {
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
        context.commit('setConnectedApps', data.result);
      });
    },
    update (context, options) {
      const { apiKey, app } = options;
      //TODO
      context.rootState.client.updateApp(apiKey, app, function (err, _, data) {
        if (err) {
          context.commit('setRequestError', data.responseJSON.errors);
          return;
        }

        context.commit('updateConnectedApp', data);
      });
    },
    revoke (context, options) {
      const { apiKey, app } = options;
      context.rootState.client.revokeOAuthApp(apiKey, app, function (err, _, data) {
        if (err) {
          context.commit('setRequestError', [data.responseText]);
          return;
        }
        context.commit('updateOAuthApp', data);
      });
    }
  }
};

export default connectedApps;
