<template>
  <section class="kuviz">
    <div class="container grid">
      <div class="full-width">
        <SectionTitle class="grid-cell" :showActionButton="false" ref="headerContainer">
          <template slot="icon">
            <img src="../../assets/icons/section-title/map.svg" width="18" height="20" />
          </template>
          <template slot="title">
              <span>{{ $t('KuvizsPage.header') }}</span>
          </template>
        </SectionTitle>
      </div>
    </div>

    <div class="container grid">
      <div class="grid-cell grid-cell--col12">
        <KuvizListHeader></KuvizListHeader>
        <ul class="kuviz__list" v-if="!isFetchingKuvizs">
          <li v-for="kuviz in kuvizs" class="full-width" :key="kuviz.id">
            <KuvizCard
            :kuviz="kuviz">
            </KuvizCard>
          </li>
        </ul>

        <ul v-else>
          <li v-for="(n) in resultsPerPage" :key="n">
            <KuvizFakeCard />
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script>
import { mapState } from 'vuex';
import Page from 'new-dashboard/components/Page';
import SectionTitle from 'new-dashboard/components/SectionTitle';
import KuvizCard from 'new-dashboard/components/Kuviz/KuvizCard.vue';
import KuvizListHeader from 'new-dashboard/components/Kuviz/KuvizListHeader.vue';
import KuvizFakeCard from 'new-dashboard/components/Kuviz/KuvizFakeCard.vue';


export default {
  name: 'KuvizsPage',
  components: {
    Page,
    SectionTitle,
    KuvizCard,
    KuvizListHeader,
    KuvizFakeCard
  },
  computed: {
      ...mapState({
      numPages: state => state.kuvizs.numPages,
      currentPage: state => state.kuvizs.page,
      kuvizs: state => state.kuvizs.list,
      isFetchingKuvizs: state => state.kuvizs.isFetching,
      numResults: state => state.kuvizs.metadata.total_entries,
      resultsPerPage: state => state.kuvizs.resultsPerPage
    }),
    isNotificationVisible () {
      return this.$store.getters['user/isNotificationVisible'];
    }
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.kuviz {
  margin-top: 64px;

  &__list {
    display: flex;
    flex-wrap: wrap;
  }
}

</style>
