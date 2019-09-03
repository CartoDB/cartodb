import * as AppsMutations from '../../../mutations/apps';
import * as AppsActions from '../../../actions/apps';

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
    setApps: AppsMutations.setApps,
    addApp: AppsMutations.addApp,
    setFetchingState: AppsMutations.setFetchingState,
    setRequestError: AppsMutations.setRequestError,
    updateOAuthApp: AppsMutations.updateOAuthApp
  },
  actions: {
    fetch: AppsActions.fetch('getOAuthApps'),
    create: AppsActions.createOAuth,
    update: AppsActions.updateOAuth,
    setApps: AppsMutations.setApps,
    regenerateCredentials: AppsActions.regenerateCredentials,

    delete (context, app) {
      const { api_key: apiKey } = context.rootState.user;

      return new Promise((resolve, reject) => {
        context.rootState.client.deleteApp(apiKey, app, function (err, _, data) {
          if (err) {
            return reject(data.responseJSON.errors);
          }
          resolve();
        });
      });
    }
  }
};

export default oAuthApps;
