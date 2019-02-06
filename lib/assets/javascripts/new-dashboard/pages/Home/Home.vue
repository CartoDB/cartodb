<template>
<section class="page page--welcome">
  <Welcome />
  <RecentSection class="section" v-if="isSectionActive('RecentSection') && hasRecentContent" @sectionChange="changeSection"/>
  <TagsSection class="section tags-section" v-if="isSectionActive('TagsSection')" @sectionChange="changeSection"/>
  <MapsSection class="section" />
  <DatasetsSection class="section section--noBorder" />
  <QuotaSection></QuotaSection>
</section>
</template>

<script>
import Welcome from './WelcomeSection/Welcome.vue';
import TagsSection from './TagsSection/TagsSection.vue';
import RecentSection from './RecentSection/RecentSection.vue';
import MapsSection from './MapsSection/MapsSection.vue';
import DatasetsSection from './DatasetsSection/DatasetsSection.vue';
import QuotaSection from './QuotaSection/QuotaSection.vue';
import { sendMetric, MetricsTypes } from 'new-dashboard/core/metrics';

export default {
  name: 'Home',
  components: {
    Welcome,
    TagsSection,
    RecentSection,
    MapsSection,
    DatasetsSection,
    QuotaSection
  },
  beforeMount () {
    this.$store.dispatch('recentContent/fetchContent');
  },
  created () {
    if (this.isFirstTimeViewingDashboard) {
      sendMetric(MetricsTypes.VISITED_PRIVATE_PAGE, { page: 'dashboard' });
    }
  },
  beforeRouteLeave (to, from, next) {
    this.$store.dispatch('datasets/resetFilters');
    this.$store.dispatch('maps/resetFilters');
    next();
  },
  data () {
    return {
      activeSection: this.$route.query.section || 'RecentSection'
    };
  },
  computed: {
    hasRecentContent () {
      return this.$store.getters['recentContent/hasRecentContent'] ||
        this.$store.state.recentContent.isFetching;
    },
    isFirstTimeViewingDashboard () {
      return this.$store.state.config.isFirstTimeViewingDashboard;
    }
  },
  methods: {
    isSectionActive (activeSection) {
      return activeSection === this.activeSection;
    },
    changeSection (nextActiveSection) {
      this.activeSection = nextActiveSection;
    }
  }
};
</script>

<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';

.page--welcome {
  padding: 64px 0 0;
}

.tags-section {
  padding-bottom: 104px;
}
</style>
