<template>
  <div id="app">
    <NavigationBar :user="user"/>
    <router-view/>
    <Footer/>
    <BackgroundPollingView ref="backgroundPollingView" :routeType="$route.name"/>
    <MamufasImportView ref="mamufasImportView"/>
  </div>
</template>

<script>
import NavigationBar from 'new-dashboard/components/NavigationBar/NavigationBar';
import Footer from 'new-dashboard/components/Footer';
import BackgroundPollingView from './components/Backbone/BackgroundPollingView.vue';
import MamufasImportView from './components/Backbone/MamufasImportView.vue';

export default {
  name: 'App',
  components: {
    NavigationBar,
    BackgroundPollingView,
    Footer,
    MamufasImportView
  },
  computed: {
    user () {
      return this.$store.state.user;
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
