<template>
  <section class="page page--welcome">
    <Welcome />
    <NotificationWarning v-if=userNotification :htmlBody=userNotification />
    <RecentSection class="section" v-if="isSectionActive('RecentSection') && hasRecentContent" @sectionChange="changeSection" @contentChanged="onContentChanged"/>
    <TagsSection class="section tags-section" v-if="isSectionActive('TagsSection')" @sectionChange="changeSection"/>
    <MapsSection class="section" @contentChanged="onContentChanged"/>
    <DatasetsSection class="section section--noBorder" @contentChanged="onContentChanged"/>
    <QuotaSection></QuotaSection>

    <router-view name="onboarding-modal"/>
  </section>
</template>

<script>
import Welcome from './WelcomeSection/Welcome.vue';
import TagsSection from './TagsSection/TagsSection.vue';
import RecentSection from './RecentSection/RecentSection.vue';
import MapsSection from './MapsSection/MapsSection.vue';
import DatasetsSection from './DatasetsSection/DatasetsSection.vue';
import QuotaSection from './QuotaSection/QuotaSection.vue';
import NotificationWarning from 'new-dashboard/components/NotificationWarning';


export default {
  name: 'Home',
  components: {
    Welcome,
    TagsSection,
    RecentSection,
    MapsSection,
    DatasetsSection,
    QuotaSection,
    NotificationWarning
  },
  beforeMount () {
    this.$store.dispatch('recentContent/fetch');

    this.$store.dispatch('maps/resetFilters');
    this.$store.dispatch('datasets/resetFilters');

    this.$store.dispatch('maps/setResultsPerPage', 6);
    this.$store.dispatch('datasets/setResultsPerPage', 6);

    this.$store.dispatch('maps/fetch');
    this.$store.dispatch('datasets/fetch');
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
    },
    userNotification () {
      return this.$store.getters['user/notification'] || null;
    }
  },
  methods: {
    isSectionActive (activeSection) {
      return activeSection === this.activeSection;
    },
    changeSection (nextActiveSection) {
      this.activeSection = nextActiveSection;
    },
    onContentChanged () {
      this.$store.dispatch('recentContent/fetch');
      this.$store.dispatch('maps/fetch');
      this.$store.dispatch('datasets/fetch');
    }
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.page {
  &--welcome {
    padding: 64px 0 0;
  }
}

.section {
  position: relative;

  &--maps {
    z-index: $z-index__stack-context--first;
  }

  &--datasets {
    z-index: $z-index__stack-context--second;
  }
}

.tags-section {
  padding-bottom: 104px;
}
</style>
