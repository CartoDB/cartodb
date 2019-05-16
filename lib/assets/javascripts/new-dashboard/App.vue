<template>
  <div id="app">

    <NavigationBar
      :user="user"
      :baseUrl="baseUrl"
      :notificationsCount="notificationsCount"
      :isNotificationVisible=isNotificationVisible
      :isFirstTimeInDashboard="isFirstTimeInDashboard"
      bundleType="dashboard"/>
    
    <NotificationWarning v-if="isNotificationVisible" :htmlBody=user.notification />

    <router-view/>

    <Footer :user="user"/>
    <BackgroundPollingView ref="backgroundPollingView" :routeType="$route.name"/>
    <MamufasImportView ref="mamufasImportView"/>
  </div>
</template>

<script>
import NavigationBar from 'new-dashboard/components/NavigationBar/NavigationBar';
import NotificationWarning from 'new-dashboard/components/NotificationWarning';
import Footer from 'new-dashboard/components/Footer';
import BackgroundPollingView from './components/Backbone/BackgroundPollingView.vue';
import MamufasImportView from './components/Backbone/MamufasImportView.vue';
import { sendMetric, MetricsTypes } from 'new-dashboard/core/metrics';

export default {
  name: 'App',
  components: {
    NavigationBar,
    NotificationWarning,
    BackgroundPollingView,
    Footer,
    MamufasImportView
  },
  created () {
    sendMetric(MetricsTypes.VISITED_PRIVATE_PAGE, { page: 'dashboard' });
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

    return { backboneViews };
  }
};
</script>

<style>
#app {
  font-family: 'Montserrat', 'Open Sans', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
}

</style>
