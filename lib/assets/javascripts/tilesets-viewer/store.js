import Vue from 'vue';
import Vuex from 'vuex';
import catalog from 'new-dashboard/store/modules/data/catalog';

Vue.use(Vuex);

const store = new Vuex.Store({
  state: {},
  getters: {},
  modules: {
    catalog
  }
});

export default store;
