import Vue from 'vue';
import Vuex from 'vuex';
import CartoNode from 'carto-node';

// Store Modules
import user from './user';
import config from './config';
import maps from './maps';
import datasets from './datasets';
import search from './search';
import notifications from './notifications';

Vue.use(Vuex);

const storeOptions = {
  state: {
    client: new CartoNode.AuthenticatedClient()
  },
  getters: {},
  modules: {
    config,
    user,
    maps,
    datasets,
    search,
    notifications
  }
};

export default new Vuex.Store(storeOptions);
