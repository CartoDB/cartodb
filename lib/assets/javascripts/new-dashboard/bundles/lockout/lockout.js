import Vue from 'vue';
import i18n from 'new-dashboard/i18n';
import store from 'new-dashboard/store';

import LockoutApp from './LockoutApp';

Vue.config.productionTip = false;

/* eslint-disable no-new */
new Vue({
  el: '#root',
  store,
  i18n,
  components: { LockoutApp },
  template: '<LockoutApp />'
});
