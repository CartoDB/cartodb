import Vue from 'vue';
import Vuex from 'vuex';

// Store Modules
import user from './user';
import config from './config';

Vue.use(Vuex);

const storeOptions = {
  state: {},
  getters: {},
  modules: {
    user,
    config
  }
};

export default new Vuex.Store(storeOptions);
