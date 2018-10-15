import './i18n';
import Vue from 'vue';
import Vuex from 'vuex';
import VModal from 'vue-js-modal';

import 'dashboard/data/backbone/sync-options';
import App from './App.vue';
import getData from './carto/get-data';
import getVisualizationsFromAPI from './carto/get-visualizations';

Vue.use(Vuex);
Vue.use(VModal, { dynamic: true, injectModalsContainer: true });
Vue.config.productionTip = false;

Promise.all([
  getData(),
  getVisualizationsFromAPI({ page: 1 })
])
  .then(([data, visualizations]) => {
    const store = new Vuex.Store({
      state: {
        config: {
          ...data.config,
          base_url: data.user_data.base_url,
          url_prefix: data.user_data.base_url
        },
        user: data.user_data,
        visualizations
      },
      mutations: {
        gotVisualizations (state, visualizations) {
          state.visualizations = visualizations;
        },
        visualizationChanged (state, visualizationModel) {
          console.log(state, visualizationModel);
          const visualizationId = visualizationModel.id;
          state.visualizations.data[visualizationId] = { ...visualizationModel.attributes };
        }
      },
      actions: {
        getVisualizations (context) {
          return getVisualizationsFromAPI({ page: 1 })
            .then(visualizations => context.commit('gotVisualizations', visualizations));
        }
      }
    });

    // Print mutation type when store is changed
    store.subscribe((mutation, state) => {
      console.log('/*********************');
      console.log(mutation.type);
      console.log(mutation.payload);
      console.log('/*********************');
    });

    new Vue({
      store,
      render: h => h(App)
    }).$mount('#app');
  });
