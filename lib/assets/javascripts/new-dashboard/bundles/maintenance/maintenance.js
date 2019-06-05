import Vue from 'vue';
import VueModal from 'vue-js-modal';
import i18n from 'new-dashboard/i18n';
import store from 'new-dashboard/store';

import MaintenanceApp from './MaintenanceApp';

import 'new-dashboard/plugins/backbone/backbone-core-models';

Vue.config.productionTip = false;

Vue.use(VueModal, { dynamic: true, injectModalsContainer: true });

/* eslint-disable no-new */
new Vue({
  el: '#root',
  store,
  i18n,
  components: { MaintenanceApp },
  template: '<MaintenanceApp />'
});
