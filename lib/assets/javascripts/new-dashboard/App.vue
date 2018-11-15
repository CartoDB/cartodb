<template>
  <div id="app">
    <NavigationBar :user="user" :baseUrl="baseUrl" :notificationsCount="notificationsCount"/>
    <router-view/>
    <BackgroundPollingView ref="backgroundPollingView"/>
  </div>
</template>

<script>
import NavigationBar from 'new-dashboard/components/NavigationBar/NavigationBar';
import BackgroundPollingView from './components/Backbone/BackgroundPollingView.vue';

export default {
  name: 'App',
  components: {
    NavigationBar,
    BackgroundPollingView
  },
  computed: {
    user () {
      return this.$store.state.user;
    },
    baseUrl () {
      return this.$store.state.user.base_url;
    },
    notificationsCount () {
      return this.$store.state.user.organizationNotifications.length;
    }
  },
  provide () {
    const backboneViews = {};
    Object.defineProperty(backboneViews, 'backgroundPollingView', {
      enumerable: true,
      get: () => this.$refs.backgroundPollingView
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
