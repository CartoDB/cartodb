import Vue from 'vue';
import VueModal from 'vue-js-modal';

import i18n from './i18n';
import store from './store';
import router from './router';
import './directives';
import './core/trackers';
import './polyfills';

import App from './App';

// Backbone Setup
import 'dashboard/data/backbone/sync-options';
import './plugins/backbone/backbone-core-models';

import './plugins/interceptor';

Vue.config.productionTip = false;

Vue.use(VueModal, { dynamic: true, injectModalsContainer: true });

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  i18n,
  components: { App },
  template: '<App/>'
});
