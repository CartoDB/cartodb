import Vue from 'vue';
import Vuex from 'vuex';

// Store Modules
import user from './user';
import config from './config';
import maps from './maps';

Vue.use(Vuex);

const storeOptions = {
  state: {},
  getters: {},
  modules: {
    config,
    user,
    maps
  }
};

export default new Vuex.Store(storeOptions);
