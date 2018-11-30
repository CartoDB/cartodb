<template>
  <section class="">
    <Welcome :user="user"></Welcome>
  </section>
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
    user () {
      return this.$store.state.user;
    },
    isFirst () {
      return false;
    }
  }
};
</script>

<!-- Add "scoped" attributBooe to limit CSS to this component only -->
<style scoped lang="scss">

</style>
