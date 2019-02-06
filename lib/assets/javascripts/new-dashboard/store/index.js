import Vue from 'vue';
import Vuex from 'vuex';
import CartoNode from 'carto-node';

// Store Modules
import user from './modules/user';
import config from './modules/config';
import maps from './modules/maps';
import datasets from './modules/datasets';
import search from './modules/search';
import notifications from './modules/notifications';
import recentContent from './modules/recent-content';

import { updateVisualizationGlobally } from './mutations/visualizations';

Vue.use(Vuex);

const storeOptions = {
  state: {
    client: new CartoNode.AuthenticatedClient()
  },
  getters: {},
  mutations: {
    updateVisualizationGlobally
  },
  modules: {
    config,
    user,
    maps,
    datasets,
    search,
    notifications,
    recentContent
  }
};

export default new Vuex.Store(storeOptions);
