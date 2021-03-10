import Vue from 'vue';
import App from './App.vue';

import i18n from './i18n';
import store from './store';
// import router from './router';

Vue.config.productionTip = false;

const el = '#app';

/* eslint-disable no-new */
new Vue({
  el,
  // router,
  store,
  i18n,
  components: { App },
  template: '<App />'
});
