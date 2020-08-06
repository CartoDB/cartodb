<template>
  <Page class="page--data">
    <SecondaryNavigation>
      <a class="catalogDetail__back title is-small" href="javascript:history.back()">
        <img class="catalogDetail__back--icon" svg-inline src="../../assets/icons/common/back.svg"/>
        <span>{{ $t('CatalogDetailPage.back') }}</span>
      </a>
    </SecondaryNavigation>

    <section v-if="!isFetchingDatasets" class="catalogDetail">
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
              <CatalogRequestSuccess v-if="hasBeenSuccesfullyRequested"></CatalogRequestSuccess>
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
          <div class="u-flex">
            <div :class="`catalog__icon catalog__icon--${getCSSModifier(dataset.category)}`"></div>
            <p class="text is-caption">{{ dataset.category }}</p>
          </div>
        </div>
        <div class="grid-cell grid-cell--col3">
          <h4 class="catalogDetail__label title is-caption">{{ $t('CatalogDetailPage.country') }}</h4>
          <div class="u-flex">
            <div :class="`catalog__icon catalog__icon--${getCSSModifier(dataset.country)}`"></div>
            <p class="text is-caption">{{ dataset.country }}</p>
          </div>
        </div>
      </div>
    </section>
  </Page>
</template>

<script>
import { mapState } from 'vuex';
import toObject from 'new-dashboard/utils/to-object';
import getCSSModifier from 'new-dashboard/utils/get-css-modifier';
import sendCustomEvent from 'new-dashboard/utils/send-custom-event';
import Page from 'new-dashboard/components/Page';
import SecondaryNavigation from 'new-dashboard/components/SecondaryNavigation';
import SectionTitle from 'new-dashboard/components/SectionTitle';
import CatalogRequestSuccess from 'new-dashboard/components/Catalog/CatalogRequestSuccess';

export default {
  name: 'CatalogDetail',
  components: {
    Page,
    SecondaryNavigation,
    SectionTitle,
    CatalogRequestSuccess
  },
  data: function () {
    return {
      hasBeenSuccesfullyRequested: false
    };
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
        const selectedDataset = datasetList[this.$route.params.id];
        sendCustomEvent('catalogSelectDataset', {
          catalogSelectedDataset: selectedDataset.name
        });
        return selectedDataset;
      }
    })
  },
  methods: {
    getCSSModifier,
    requestDataset () {
      this.$store.dispatch('catalog/requestDataset', { user: this.user, dataset: this.dataset })
        .then(
          () => {
            this.hasBeenSuccesfullyRequested = true;
            this.sendCustomCatalogEvents(this.dataset);
          }
        );
    },
    sendCustomCatalogEvents (dataset) {
      sendCustomEvent('catalogRequestDataset', {
        catalogRequestedDataset: dataset.name
      });
      sendCustomEvent('catalogRequestCountry', {
        catalogRequestedCountry: dataset.country
      });
      sendCustomEvent('catalogRequestCategory', {
        catalogRequestedCategory: dataset.category
      });
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";

.full-width {
  width: 100%;
}

.catalogDetail {
  margin-top: 64px;

  &__back {
    display: flex;
    align-items: center;
    padding: 24px 0;

    &--icon {
      width: 7px;
      height: 12px;
      margin-right: 8px;
    }
  }

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

.catalog__icon {
  width: 24px;
  height: 24px;
  margin-right: 12px;
  background-size: contain;
}
</style>
