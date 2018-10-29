<template>
  <div id="app">
    <NavigationBar :user="user"/>
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
    }
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
