import Vue from 'vue';
import i18n from 'new-dashboard/i18n';

import Footer from 'new-dashboard/components/Footer';
import getCARTOData from 'new-dashboard/store/utils/getCARTOData';

Vue.config.productionTip = false;

const CARTOData = getCARTOData();
const user = CARTOData.user_data;
// const baseUrl = CARTOData.user_data.base_url;
// const notificationsCount = CARTOData.organization_notifications.length;

/* eslint-disable no-new */
new Vue({
  el: '#footer',
  i18n,
  components: { Footer },
  data () {
    return {
      user
      // baseUrl,
      // notificationsCount
    };
  },
  template: '<Footer :user="user"/>'
});
