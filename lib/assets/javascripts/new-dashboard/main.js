import Vue from 'vue';
import App from './App';
import router from './router';
import store from './store';
import i18n from './i18n';

import './plugins/backbone-core-models';

Vue.config.productionTip = false;

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  i18n,
  components: { App },
  template: '<App/>'
});
