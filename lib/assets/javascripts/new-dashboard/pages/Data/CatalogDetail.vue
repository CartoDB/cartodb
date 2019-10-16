<template>
  <Page class="page--data">
    <section class="secondaryNavigation">
      <div class="secondaryNavigation__content">
        <a class="secondaryNavigation__back title is-small" href="">{{ $t('CatalogDetailPage.back') }}</a>

      </div>
    </section>

    <section class="catalogDetail">
      <div class="container grid">
        <div class="full-width">
          <SectionTitle class="grid-cell">
            <template slot="icon">
              <img src="../../assets/icons/section-title/data.svg" width="18" height="20" />
            </template>
            <template slot="title">
                <span>{{ dataset.name }}</span>
            </template>

            <template slot="actionButton">
              <span v-if="hasBeenSuccesfullyRequested">BIEN</span>
              <button v-else class="button is-primary" @click="requestDataset">{{ $t('CatalogDetailPage.requestDataset') }}</button>
            </template>
          </SectionTitle>

          <div class="catalogDetail__description grid-cell">
            <span class="text is-caption">
              {{ dataset.description }}
            </span>
          </div>
        </div>
        <div class="grid-cell grid-cell--col6">
          <h4 class="catalogDetail__label title is-caption">{{ $t('CatalogDetailPage.variableGroups') }}</h4>
          <ul v-for="variable in dataset.variable_name" :key="variable" class="catalogDetail__list">
            <li class="text is-caption catalogDetail__list--item">{{variable}}</li>
          </ul>
        </div>
        <div class="grid-cell grid-cell--col3">
          <h4 class="catalogDetail__label title is-caption">{{ $t('CatalogDetailPage.category') }}</h4>
          <p class="text is-caption">{{ dataset.category }}</p>
        </div>
        <div class="grid-cell grid-cell--col3">
          <h4 class="catalogDetail__label title is-caption">{{ $t('CatalogDetailPage.country') }}</h4>
          <p class="text is-caption">{{ dataset.country }}</p>
        </div>
      </div>
    </section>
  </Page>
</template>

<script>
import Page from 'new-dashboard/components/Page';
import SectionTitle from 'new-dashboard/components/SectionTitle';
import toObject from 'new-dashboard/utils/to-object';
import { mapState } from 'vuex';

export default {
  name: 'CatalogDetail',
  components: {
    Page,
    SectionTitle
  },
  data: function () {
    return {
      hasBeenSuccesfullyRequested: false
    }
  },
  computed: {
  ...mapState({
    user: state => state.user,
    datasets: state => state.catalog.list,
    isFetchingDatasets: state => state.catalog.isFetching,
    dataset (state) {
      if (this.isFetchingDatasets) {
        return {};
      }
      
      const datasetList = toObject(this.datasets, 'id');
      return datasetList[this.$route.params.id];
    }
  })
  },
  methods: {
    requestDataset () {
      this.$store.dispatch('catalog/requestDataset',
      { user: this.user, dataset: this.dataset })
      .then(
        () => {
          this.hasBeenSuccesfullyRequested = true;
        }
      )
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";

.page--data {
  padding-top: 64px;
}

.full-width {
  width: 100%;
}

.secondaryNavigation {
  position: sticky;
  z-index: 4;
  top: 64px;
  height: 64px;
  border-bottom: 1px solid $neutral--300;
  background-color: $white;

  &__content {
    display: flex;
    align-items: center;
    max-width: 940px;
    margin: 0 auto;
    padding: 0 20px;
  }

  &__back {
    padding: 24px 0 20px;
  }
}

.catalogDetail {
  margin-top: 64px;

  &__description {
    margin-bottom: 64px;
  }

  &__label {
    margin-bottom: 24px;
  }

  &__list {
    list-style-position: inside;
    list-style-type: disc;

    &--item {
      margin-bottom: 16px;
    }
  }
}

</style>
