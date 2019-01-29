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
// import compareAsc from 'date-fns/compare_asc';
// import toObject from 'new-dashboard/utils/to-object';

export default {
  name: 'RecentSection',
  components: {
    SectionTitle,
    SimpleMapCard
  },
  mounted () {
    this.$store.dispatch('recentContent/fetchContent');
  },
  computed: {
    ...mapState({
      // datasets: state => state.datasets.list,
      // maps: state => state.maps.list,
      // areMapsFiltered: state => state.maps.isFiltered,
      // areDatasetsFiltered: state => state.datasets.isFiltered,
      // areMapsFetching: state => state.maps.isFetching,
      // areDatasetsFetching: state => state.datasets.isFetching
      recentContent: state => state.recentContent.list
    }),
    visibleSections () {
      return ['privacy', 'lastModification'];
    }
    // recentContent () {
    //   if (this.areMapsFetching || this.areDatasetsFetching) {
    //     return [];
    //   }

    //   const recentContent = {
    //     ...this.maps,
    //     ...this.datasets
    //   };

    //   const recentContentIds = Object.keys(recentContent)
    //     .sort((elementA, elementB) =>
    //       compareAsc(recentContent[elementB].updated_at, recentContent[elementA].updated_at)
    //     );

    //   return recentContentIds
    //     .slice(0, 3)
    //     .map(id => recentContent[id]);
    // }
  }
};
</script>

<style scoped lang="scss">
@import "stylesheets/new-dashboard/variables";
</style>
