import CartoNode from 'carto-node';
import Vue from 'vue';
import Vuex from 'vuex';

// Store Modules
import user from './user';
import config from './config';
import maps from './maps';
import datasets from './datasets';
import NotificationsFactory from './notifications/NotificationsFactory';

Vue.use(Vuex);

const client = new CartoNode.AuthenticatedClient();
const notifications = NotificationsFactory.create(client);

const storeOptions = {
  state: {},
  getters: {},
  modules: {
    config,
    user,
    maps,
    datasets,
    notifications
  }
};

export default new Vuex.Store(storeOptions);
