import Vue from 'vue';
import Vuex from 'vuex';
import CartoNode from 'carto-node';

// Use packages builds, instead of the whole bundle
// Note: at version 0.0.1-rc.17 default is umd not transpiled (beware of ie11!)
import { Credentials } from '@carto/toolkit-core';
import { CustomStorage } from '@carto/toolkit-custom-storage';

// Store Modules
import user from './modules/user';
import config from './modules/config';
import maps from './modules/maps/carto';
import externalMaps from './modules/maps/external-maps';
import datasets from './modules/data/datasets';
import connectors from './modules/data/connectors';
import catalog from './modules/data/catalog';
import search from './modules/search';
import notifications from './modules/notifications';
import recentContent from './modules/recent-content';
import oAuthApps from './modules/apps/oAuth';
import connectedApps from './modules/apps/connected';
import directDBConnection from './modules/direct-db-connection';
import tilesets from './modules/data/tilesets';

const EXTERNAL_MAPS_NAMESPACE = 'keplergl';
const METRICS_CLIENT_ID = 'carto-dashboard';
const sqlApiTemplate = config.state.sql_api_template
  ? config.state.sql_api_template.replace(/\/?(\?|#|$)/, '/$1')
  : Credentials.DEFAULT_SERVER_URL_TEMPLATE;

Vue.use(Vuex);

const storeOptions = {
  state: {
    client: new CartoNode.AuthenticatedClient(),
    customStorage: new CustomStorage(
      EXTERNAL_MAPS_NAMESPACE,
      new Credentials(
        user.state.username,
        user.state.api_key,
        sqlApiTemplate
      ),
      {
        client: METRICS_CLIENT_ID
      }
    )
  },
  getters: {},
  modules: {
    config,
    user,
    maps,
    externalMaps,
    datasets,
    connectors,
    catalog,
    search,
    notifications,
    recentContent,
    oAuthApps,
    connectedApps,
    directDBConnection,
    tilesets
  }
};

export default new Vuex.Store(storeOptions);
