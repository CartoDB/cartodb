<template>
  <Welcome></Welcome>
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
  }
};
</script>
