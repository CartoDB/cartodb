<template>
  <div id="app">
    <header class="header" :class="{ 'has-user-notification': isNotificationVisible }">
      <NotificationCarto3Release v-if="isCarto3ReleaseNotificationVisible" @onClose="closeCarto3Release" />
      <NotificationWarning v-if="isNotificationVisible" :htmlBody=user.notification />
      <NavigationBar
        :user="user"
        :baseUrl="baseUrl"
        :notificationsCount="notificationsCount"
        :isNotificationVisible="isNotificationVisible || isCarto3ReleaseNotificationVisible"
        :isFirstTimeInDashboard="isFirstTimeInDashboard"
        bundleType="dashboard"/>
    </header>
    <div :class="{'with-notification': isNotificationVisible || isCarto3ReleaseNotificationVisible}">
      <router-view/>
    </div>

    <Footer :user="user"/>
    <BackgroundPollingView ref="backgroundPollingView" :routeType="$route.name"/>
    <MamufasImportView ref="mamufasImportView"/>
    <div id="tooltip-portal"></div>
  </div>
</template>

<script>
import NavigationBar from 'new-dashboard/components/NavigationBar/NavigationBar';
import NotificationCarto3Release from 'new-dashboard/components/NotificationCarto3Release';
import NotificationWarning from 'new-dashboard/components/NotificationWarning';
import Footer from 'new-dashboard/components/Footer';
import BackgroundPollingView from './components/Backbone/BackgroundPollingView.vue';
import MamufasImportView from './components/Backbone/MamufasImportView.vue';
import { sendMetric, MetricsTypes } from 'new-dashboard/core/metrics';

const notificationIsVisible = (date) => {
  if (date) {
    const today = new Date().getTime();
    const oneMonth = 30 * 24 * 60 * 60 * 1000;
    const future = parseInt(date) + oneMonth;
    return today > future;
  }
  return true;
};

export default {
  name: 'App',
  components: {
    NavigationBar,
    NotificationCarto3Release,
    NotificationWarning,
    BackgroundPollingView,
    Footer,
    MamufasImportView
  },
  data: () => ({
    displayCarto3ReleaseNotification: notificationIsVisible(window.localStorage.getItem('carto3ReleaseVisibleV2'))
  }),
  created () {
    sendMetric(MetricsTypes.VISITED_PRIVATE_PAGE, { page: 'dashboard' });
  },
  methods: {
    closeCarto3Release () {
      window.localStorage.setItem('carto3ReleaseVisibleV2', new Date().getTime());
      this.displayCarto3ReleaseNotification = false;
    }
  },
  computed: {
    user () {
      return this.$store.state.user;
    },
    isEnterprise () {
      return this.$store.state.user && this.$store.state.user.is_enterprise;
    },
    isNotificationVisible () {
      return !!this.$store.getters['user/isNotificationVisible'];
    },
    isCarto3ReleaseNotificationVisible () {
      return this.isEnterprise && this.displayCarto3ReleaseNotification;
    },
    baseUrl () {
      return this.$store.state.user.base_url;
    },
    notificationsCount () {
      return this.$store.state.user.organizationNotifications.length;
    },
    isFirstTimeInDashboard () {
      return this.$store.state.config.isFirstTimeViewingDashboard;
    }
  },
  provide () {
    const backboneViews = {};

    Object.defineProperty(backboneViews, 'backgroundPollingView', {
      enumerable: true,
      get: () => this.$refs.backgroundPollingView
    });

    Object.defineProperty(backboneViews, 'mamufasImportView', {
      enumerable: true,
      get: () => this.$refs.mamufasImportView
    });

    const addLayer = () => console.log('Method implemented in builder');

    return { backboneViews, addLayer };
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

#app {
  font-family: 'Montserrat', 'Open Sans', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
}

.header {
  padding-top: $header__height;

  &.has-user-notification {
    padding-top: $header__height + $notification-warning__height;
  }
}

.with-notification {
  margin-top: 48px;
}

</style>
