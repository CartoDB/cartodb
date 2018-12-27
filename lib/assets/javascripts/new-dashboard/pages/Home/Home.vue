<template>
<section class="page page--welcome">
  <Welcome />
  <MapsSection class="section" />
  <DatasetsSection class="section section--noBorder" />
  <QuotaSection></QuotaSection>
</section>
</template>

<script>
import Welcome from './WelcomeSection/Welcome.vue';
import MapsSection from './MapsSection/MapsSection.vue';
import DatasetsSection from './DatasetsSection/DatasetsSection.vue';
import QuotaSection from './QuotaSection/QuotaSection.vue';

export default {
  name: 'Home',
  components: {
    Welcome,
    MapsSection,
    DatasetsSection,
    QuotaSection
  },
  beforeRouteLeave (to, from, next) {
    this.$store.dispatch('datasets/resetFilters');
    this.$store.dispatch('maps/resetFilters');
    next();
  }
};
</script>

<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';

.page--welcome {
  padding: 64px 0;
}
</style>
