<template>
  <section class="kuviz">
    <div class="container grid">
      <div class="full-width">
        <SectionTitle class="grid-cell" :showActionButton="false" ref="headerContainer">
          <template slot="icon">
            <img src="../../assets/icons/section-title/map.svg" width="18" height="20" />
          </template>
          <template slot="title">
              <span>{{ $t('KuvizPage.header') }}</span>
          </template>
          <template slot="actionButton">
            <router-link
              class="button is-primary"
              :to="{ name: 'onboarding-open', params: { onboardingId: 'cartoframes'} , hash: '#step-1'}"
              target= "_blank">
              {{ $t('KuvizPage.new') }}
           </router-link>
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
  name: 'KuvizPage',
  components: {
    Page,
    SectionTitle,
    KuvizCard,
    KuvizListHeader,
    KuvizFakeCard
  },
  computed: {
      ...mapState({
      numPages: state => state.kuviz.numPages,
      currentPage: state => state.kuviz.page,
      kuvizs: state => state.kuviz.list,
      isFetchingKuvizs: state => state.kuviz.isFetching,
      numResults: state => state.kuviz.numResults,
      resultsPerPage: state => state.catalog.resultsPerPage
    }),
    isNotificationVisible () {
      return this.$store.getters['user/isNotificationVisible'];
    },
    shouldShowPagination () {
      return !this.isFetchingKuvizs && this.numPages > 1;
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
