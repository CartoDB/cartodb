<template>
  <a href=""
     target="_blank"
     class="catalogCard">

    <div class="catalogCard__column">
      <div class="catalogCard__cell cell">
        <div class="catalogCard__cell--category">
          <div class="catalogCard__iconCategory" :class="`catalogCard__iconCategory--${formattedCategory}`"></div>
        </div>
      </div>
      <div class="cell cell--main u-flex u-flex__align--center">
        <span class="text is-caption is-semibold is-txtGrey u-ellipsis catalogCard__title">
          {{ dataset.name }}
        </span>
      </div>
    </div>

    <div class="catalogCard__column">
      <div class="cell catalogCard__cell--large">
        <span class="text is-small is-txtSoftGrey u-ellipsis">
          {{ formattedSpatialAggregations}}
        </span>
      </div>
    </div>

    <div class="catalogCard__column">
      <div class="cell cell--large">
        <span class="text is-small is-txtSoftGrey">
          {{ formattedFrequency }}
        </span>
      </div>
      <div class="cell cell--large">
        <span class="text is-small is-txtSoftGrey">
          {{ formattedSource }}
        </span>
      </div>
    </div>
  </a>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'CatalogCard',
  props: {
    dataset: Object
  },
  computed: {
    ...mapState({
      categories: state => state.catalog.categories
    }),
    formattedSpatialAggregations () {
      return this.dataset.spatial_aggregations.join(', ');
    },
    formattedFrequency () {
      return this.dataset.frequency.join(', ');
    },
    formattedSource () {
      return this.dataset.source.join(', ');
    },
    formattedCategory () {
      if (!this.categories.includes(this.dataset.category)) {
        return 'default'
      }
      return this.dataset.category.replace(/ /g,'-').toLowerCase();
    }
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.catalogCard {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 16px;
  overflow: hidden;
  border-bottom: 1px solid $softblue;
  background-color: $white;

  &:hover {
    background-color: $softblue;
    text-decoration: none;
  }

  &__title {
    color: $primary-color;
    text-decoration: underline;
  }

  &__column {
    display: flex;
    flex: 0 0 33.3334%;
    justify-content: center;
    max-width: 33.3334%;
  }

  &__cell {
    width: 58px;
    height: 100%;
    padding-left: 0;

    &--large {
      flex-grow: 1;
      flex-shrink: 1;
      width: 280px;
    }

    &--category {
      display: flex;
      flex-direction: column;
      justify-content: center;
      width: 36px;
      height: 36px;
      margin-right: 6px;
      padding: 9px;
      overflow: hidden;
      transition: all 0.25s cubic-bezier(0.4, 0.01, 0.165, 0.99);
      border-radius: 2px;
      background-color: $softblue;
    }
  }

  &__iconCategory {
    width: 100%;
    height: 100%;
    background-repeat: no-repeat;
    background-position: center;

    &--financial {
      background-image: url("../../assets/icons/catalog/financial.svg");
    }

    &--human-mobility {
      background-image: url("../../assets/icons/catalog/human-mobility.svg");
    }

    &--demographics {
      background-image: url("../../assets/icons/catalog/demographics.svg");
    }

    &--housing {
      background-image: url("../../assets/icons/catalog/housing.svg");
    }

    &--road-traffic {
      background-image: url("../../assets/icons/catalog/road-traffic.svg");
    }

    &--points-of-interest {
      background-image: url("../../assets/icons/catalog/points-of-interest.svg");
    }

    &--environmental {
      background-image: url("../../assets/icons/catalog/environmental.svg");
    }

    &--global-boundaries {
      background-image: url("../../assets/icons/catalog/global-boundaries.svg");
    }
  }

  // &__icon {
  //   width: 36px;
  //   height: 36px;
  //   margin-right: 6px;
  //   padding: 9px;
  //   overflow: hidden;
  //   transition: all 0.25s cubic-bezier(0.4, 0.01, 0.165, 0.99);
  //   border-radius: 2px;
  //   background-color: $softblue;
  // }
}
</style>
