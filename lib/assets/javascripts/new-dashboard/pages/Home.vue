<template>
  <Welcome :username="username"></Welcome>
</template>

<script>
import Welcome from '../components/Home/Welcome';

export default {
  name: 'Home',
  components: {
    Welcome
  },
  data () {
    return {
      msg: "Welcome to CARTO\'s new dashboard"
    };
  },
  computed: {
    username () {
      return this.$store.state.user.username;
    },
    isFirst () {
      return false;
    }
  }
};
</script>

<style scoped lang="scss"></style>
