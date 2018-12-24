<template>
<section class="page page--welcome">
  <Welcome />
  <MapsSection class="section" />
  <DatasetsSection class="section section--noBorder" />
  <section class="section">
    <div class="container grid">
      <div class="full-width">
        <SectionTitle :title="metricsTitle">
          <template slot="icon">
            <img src="../../assets/icons/section-title/metrics.svg">
          </template>
        </SectionTitle>
        <img svg-inline src="../../assets/placeholders/quotas.svg">
      </div>
    </div>
  </section>
</section>
</template>

<script>
import Welcome from './WelcomeSection/Welcome.vue';
import MapsSection from './MapsSection/MapsSection.vue';
import DatasetsSection from './DatasetsSection/DatasetsSection.vue';
import SectionTitle from 'new-dashboard/components/SectionTitle';

export default {
  name: 'Home',
  components: {
    Welcome,
    MapsSection,
    DatasetsSection,
    SectionTitle
  },
  computed: {
    metricsTitle () {
      return this.$t(`HomePage.MetricsSection.title`);
    }
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
  padding: 0;
}
</style>
