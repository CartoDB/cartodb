<template>
<section class="page page--welcome">
  <Welcome />
  <RecentSection class="section" v-if="isSectionActive('RecentSection') && hasRecentContent" @sectionChange="changeSection"/>
  <TagsSection class="section" v-if="isSectionActive('TagsSection')" @sectionChange="changeSection"/>
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
  beforeRouteLeave (to, from, next) {
    this.$store.dispatch('datasets/resetFilters');
    this.$store.dispatch('maps/resetFilters');
    next();
  },
  data () {
    return {
      activeSection: 'RecentSection'
    };
  },
  computed: {
    hasRecentContent () {
      return this.$store.getters['recentContent/hasRecentContent'] ||
        this.$store.state.recentContent.isFetching;
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
</style>
