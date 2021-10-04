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
    <router-view/>

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
    isCarto3ReleaseNotificationVisible: window.localStorage.getItem('carto3ReleaseVisible') !== 'false'
  }),
  created () {
    sendMetric(MetricsTypes.VISITED_PRIVATE_PAGE, { page: 'dashboard' });
  },
  methods: {
    closeCarto3Release () {
      window.localStorage.setItem('carto3ReleaseVisible', false);
      this.isCarto3ReleaseNotificationVisible = false;
    }
  },
  computed: {
    user () {
      return this.$store.state.user;
    },
    isNotificationVisible () {
      return !!this.$store.getters['user/isNotificationVisible'];
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

</style>
