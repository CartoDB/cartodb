<template>
  <div id="app">
    <NavigationBar :user="user" :configModel="configModel" :userModel="userModel"/>
    <router-view/>
  </div>
</template>

<script>
import NavigationBar from 'new-dashboard/components/NavigationBar/NavigationBar';

export default {
  name: 'App',
  components: {
    NavigationBar
  },
  computed: {
    user () {
      return this.$store.state.user;
    },
    userModel () {
      return this.$store.state.user.userModel;
    },
    configModel () {
      return this.$store.state.config.configModel;
    }
  }
};
</script>

<style>
#app {
  font-family: 'Montserrat', 'Open Sans', Arial, sans-serif;
  -webkit-font-smoothing: subpixel-antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
}
</style>
