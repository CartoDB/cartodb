import Vue from 'vue';
import i18n from 'new-dashboard/i18n';
import store from 'new-dashboard/store';

import TrialExpiredApp from './TrialExpiredApp';

Vue.config.productionTip = false;

/* eslint-disable no-new */
new Vue({
  el: '#root',
  store,
  i18n,
  components: { TrialExpiredApp },
  template: '<TrialExpiredApp />'
});
