import Vue from 'vue';
import i18n from 'new-dashboard/i18n';

import NavigationBar from 'new-dashboard/components/NavigationBar/NavigationBar';
import 'new-dashboard/bundles/header/components/RouterLink';
import 'new-dashboard/directives/click-outside';

Vue.config.productionTip = false;

const user = window.CartoConfig.data.user_data;
const baseUrl = window.CartoConfig.data.user_data.base_url;
const notificationsCount = window.CartoConfig.data.organization_notifications.length;

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
