import Vue from 'vue';
import i18n from 'new-dashboard/i18n';
import store from 'new-dashboard/store';
import getCARTOData from 'new-dashboard/store/utils/getCARTOData';

import MaintenanceApp from './MaintenanceApp';

Vue.config.productionTip = false;

const CARTOData = getCARTOData();
const user = CARTOData.user_data;

/* eslint-disable no-new */
new Vue({
  el: '#root',
  i18n,
  store,
  components: { MaintenanceApp },
  data () {
    return { user };
  },
  template: '<MaintenanceApp :user="user"/>'
});
