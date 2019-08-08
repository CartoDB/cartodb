import * as AppsMutations from '../../../mutations/apps';
import * as AppsActions from '../../../actions/apps';

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
    setApps: AppsMutations.setApps,
    setRequestError: AppsMutations.setRequestError,
    setFetchingState: AppsMutations.setFetchingState
  },
  actions: {
    fetch: AppsActions.fetch('getConnectedApps'),

    revoke (context, app) {
      const { api_key: apiKey } = context.rootState.user;

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
