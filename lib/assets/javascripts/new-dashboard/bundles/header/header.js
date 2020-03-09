import Vue from 'vue';
import i18n from 'new-dashboard/i18n';

import NavigationBar from 'new-dashboard/components/NavigationBar/NavigationBar';
import NotificationWarning from 'new-dashboard/components/NotificationWarning';
import 'new-dashboard/bundles/header/components/RouterLink';
import 'new-dashboard/directives/click-outside';
import getCARTOData from 'new-dashboard/store/utils/getCARTOData';

import './overrides.scss';

Vue.config.productionTip = false;

const CARTOData = getCARTOData();
const user = CARTOData.user_data;
const baseUrl = CARTOData.user_data.base_url;
const notificationsCount = CARTOData.organization_notifications.length;
const userNotification = CARTOData.user_data.notification;
const isNotificationVisible = !!userNotification;

/* eslint-disable no-new */
new Vue({
  el: '#header',
  i18n,
  components: {
    NavigationBar,
    NotificationWarning
  },
  data () {
    return {
      user,
      baseUrl,
      notificationsCount,
      isNotificationVisible,
      userNotification
    };
  },
  template: `
    <header id="header" :class="{ 'has-user-notification': isNotificationVisible }">
      <NotificationWarning v-if="isNotificationVisible" :htmlBody="userNotification" />
      <NavigationBar
        class="nd-navbar"
        :user="user"
        :baseUrl="baseUrl"
        :isNotificationVisible="isNotificationVisible"
        :notificationsCount="notificationsCount" />
    </header>
  `
});
