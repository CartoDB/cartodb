<template>
  <section class="datasets-section">
    <div class="container grid">
      <SectionTitle :title="title">
        <template slot="icon">
          <img src="../../../assets/icons/section-title/data.svg">
        </template>
      </SectionTitle>

      <DatasetsList
        v-if="!isEmptyState"
        :datasets="datasets"
        @dataChanged="fetchDatasets">
      </DatasetsList>

      <InitialState :title="$t(`DataPage.zeroCase.title`)" v-if="isInitialState">
        <template slot="icon">
          <img svg-inline src="../../../assets/icons/datasets/initialState.svg">
        </template>
        <template slot="description">
          <p class="text is-caption is-txtGrey" v-html="$t(`DataPage.zeroCase.description`)"></p>
        </template>
        <template slot="actionButton">
          <CreateButton visualizationType="maps">{{ $t(`DataPage.zeroCase.createMap`) }}</CreateButton>
        </template>
      </InitialState>

      <EmptyState v-if="isEmptyState && !isInitialState" :text="$t('DataPage.emptyState')" >
        <img svg-inline src="../../../assets/icons/common/compass.svg">
      </EmptyState>
    </div>
  </section>
</template>

<script>
import { mapState } from 'vuex';
import SectionTitle from 'new-dashboard/components/SectionTitle';
import InitialState from 'new-dashboard/components/States/InitialState';
import EmptyState from 'new-dashboard/components/States/EmptyState';
import CreateButton from 'new-dashboard/components/CreateButton';

export default {
  name: 'DatasetsSection',
  components: {
    CreateButton,
    EmptyState,
    InitialState,
    SectionTitle
  },
  created: function () {
    this.$store.dispatch('datasets/setPerPage', 6);
    this.fetchMaps();
  },
  computed: {
    ...mapState({
    }),
    title () {
      return this.$t('HomePage.DatasetsSection.title');
    },
    isEmptyState () {
      return true;
    },
    isInitialState () {
      return false;
    }
  }
};
</script>

<style scoped lang="scss">
@import "stylesheets/new-dashboard/variables";

// .datasets-section {
  // position: relative;
  // padding: 64px 0;

  // .head-section,
  // .empty-state {
  //   width: 100%;
  // }
// }
</style>
