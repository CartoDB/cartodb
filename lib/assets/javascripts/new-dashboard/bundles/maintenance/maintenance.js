import Vue from 'vue';
import i18n from 'new-dashboard/i18n';

import MaintenanceApp from './MaintenanceApp';

Vue.config.productionTip = false;

/* eslint-disable no-new */
new Vue({
  el: '#root',
  i18n,
  components: { MaintenanceApp },
  template: '<MaintenanceApp />'
});
