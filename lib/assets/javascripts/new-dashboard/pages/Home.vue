<template>
<main class="app-main">
  <Welcome></Welcome>
  <MapsSection></MapsSection>
</main>
</template>

<script>
import Welcome from '../components/Home/Welcome/Welcome.vue';
import MapsSection from '../components/Home/Maps/MapsSection.vue';

export default {
  name: 'Home',
  components: {
    Welcome,
    MapsSection
  },
  data () {
    return {
      msg: 'Welcome to CARTO\'s new dashboard'
    };
  }
};
</script>

<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';

.app-main {
  position: relative;
  top: 64px;
}
</style>
