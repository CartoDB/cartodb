import Vue from 'vue';
import VueModal from 'vue-js-modal';
import i18n from './i18n';
import store from './store';
import router from './router';
import App from './App';

// Legacy
import 'dashboard/data/backbone/sync-options';
import './plugins/backbone/backbone-core-models';

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
