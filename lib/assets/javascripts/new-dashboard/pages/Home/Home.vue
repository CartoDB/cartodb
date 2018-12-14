<template>
<section class="page page--welcome">
  <Welcome />
  <MapsSection />
  <DatasetsSection />
</section>
</template>

<script>
import Welcome from './WelcomeSection/Welcome.vue';
import MapsSection from './MapsSection/MapsSection.vue';
import DatasetsSection from './DatasetsSection/DatasetsSection.vue';

export default {
  name: 'Home',
  components: {
    Welcome,
    MapsSection,
    DatasetsSection
  },
  beforeRouteLeave (to, from, next) {
    this.$store.dispatch('datasets/resetFilters', false);
    next();
  }
};
</script>

<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';

.page--welcome {
  padding: 0;
}
</style>
