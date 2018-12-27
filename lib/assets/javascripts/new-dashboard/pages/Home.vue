<template>
  <section class="page">
    <Welcome></Welcome>
    <QuotaModule></QuotaModule>
  </section>
</template>

<script>
// import { mapState } from 'vuex';
import Welcome from '../components/Home/Welcome';
import QuotaModule from '../components/Quotas/QuotaModule';

export default {
  name: 'Home',
  components: {
    Welcome,
    QuotaModule
  },
  data () {
    return {
      msg: "Welcome to CARTO\'s new dashboard"
    };
  }
};
</script>
