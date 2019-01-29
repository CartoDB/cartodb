<template>
  <section class="recent-section is-bgSoftBlue">
    <div class="container">
      <SectionTitle class="grid-cell" title="Recent content">
        <template slot="icon">
          <img src="../../../assets/icons/section-title/recent.svg">
        </template>
      </SectionTitle>

      <ul class="grid">
        <li class="card grid-cell grid-cell--col4 grid-cell--col6--tablet grid-cell--col12--mobile" v-for="visualization in recentContent" :key="visualization.id">
          <SimpleMapCard :visualization="visualization" :canHover="false" :visibleSections="visibleSections" storeActionType="recentContent"/>
        </li>
      </ul>
    </div>
  </section>
</template>

<script>
import { mapState } from 'vuex';
import SectionTitle from 'new-dashboard/components/SectionTitle';
import SimpleMapCard from 'new-dashboard/components/MapCard/SimpleMapCard.vue';

export default {
  name: 'RecentSection',
  components: {
    SectionTitle,
    SimpleMapCard
  },
  created () {
    this.$store.dispatch('recentContent/fetchContent');
  },
  computed: {
    ...mapState({
      recentContent: state => state.recentContent.list
    }),
    visibleSections () {
      return ['privacy', 'lastModification'];
    }
  }
};
</script>

<style scoped lang="scss">
@import "stylesheets/new-dashboard/variables";
</style>
