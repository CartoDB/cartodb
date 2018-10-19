import Vue from 'vue';
import Vuex from 'vuex';

// Store Modules
import user from './user';

Vue.use(Vuex);

const storeOptions = {
  state: {},
  getters: {},
  modules: {
    user
  }
};

export default new Vuex.Store(storeOptions);
