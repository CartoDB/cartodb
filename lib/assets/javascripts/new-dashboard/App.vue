<template>
  <div id="app">
    <NavigationBar :user="user"/>
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
    user() {
      return this.$store.state.user;
    }
  }
};
</script>

<style>
#app {
  font-family: 'Montserrat', 'Roboto', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
}

* {
  box-sizing: border-box;
}
</style>
