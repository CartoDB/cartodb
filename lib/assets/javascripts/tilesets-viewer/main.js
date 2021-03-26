import Vue from 'vue';
import App from './App.vue';

import i18n from './i18n';
import store from './store';

Vue.config.productionTip = false;

const el = '#app';

/* eslint-disable no-new */
new Vue({
  el,
  store,
  i18n,
  components: { App },
  template: '<App />'
});
