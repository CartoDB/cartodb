import Vue from 'vue';
import Vuex from 'vuex';
import CartoNode from 'carto-node';
import {CustomStorage} from '@carto/toolkit';

// Store Modules
import user from './modules/user';
import config from './modules/config';
import maps from './modules/maps/carto';
import externalMaps from './modules/maps/external-maps';
import datasets from './modules/data/datasets';
import catalog from './modules/data/catalog';
import search from './modules/search';
import notifications from './modules/notifications';
import recentContent from './modules/recent-content';
import oAuthApps from './modules/apps/oAuth';
import connectedApps from './modules/apps/connected';

const EXTERNAL_MAPS_NAMESPACE = 'keplergl';

Vue.use(Vuex);

const storeOptions = {
  state: {
    client: new CartoNode.AuthenticatedClient(),
    customStorage: new CustomStorage(
      EXTERNAL_MAPS_NAMESPACE,
      user.state.username,
      user.state.api_key,
      config.state.sql_api_template)
  },
  getters: {},
  modules: {
    config,
    user,
    maps,
    externalMaps,
    datasets,
    catalog,
    search,
    notifications,
    recentContent,
    oAuthApps,
    connectedApps
  }
};

export default new Vuex.Store(storeOptions);
