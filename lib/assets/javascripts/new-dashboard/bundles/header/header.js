import Vue from 'vue';
import i18n from 'new-dashboard/i18n';

import NavigationBar from 'new-dashboard/components/NavigationBar/NavigationBar';
import 'new-dashboard/bundles/header/components/RouterLink';
import 'new-dashboard/directives/click-outside';
import getCARTOData from 'new-dashboard/store/utils/getCARTOData';

Vue.config.productionTip = false;

const CARTOData = getCARTOData();
const user = CARTOData.user_data;
const baseUrl = CARTOData.user_data.base_url;
const notificationsCount = CARTOData.organization_notifications.length;

/* eslint-disable no-new */
new Vue({
  el: '#header',
  i18n,
  components: { NavigationBar },
  data () {
    return {
      user,
      baseUrl,
      notificationsCount
    };
  },
  template: '<NavigationBar :user="user" :baseUrl="baseUrl" :notificationsCount="notificationsCount"/>'
});
