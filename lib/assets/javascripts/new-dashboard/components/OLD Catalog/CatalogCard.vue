<template>
  <a class="catalogCard" @click="onClick">

    <div class="catalogCard__column">
      <div class="catalogCard__cell cell">
        <div class="catalogCard__cell--category">
          <div class="catalog__icon" :class="`catalog__icon--${formattedCategory}`"></div>
        </div>
      </div>
      <div class="cell cell--main u-flex u-flex__align--center">
        <span class="text is-caption is-txtGrey u-ellipsis catalogCard__title">
          {{ dataset.name }}
        </span>
      </div>
    </div>

    <div class="catalogCard__column">
      <div class="cell catalogCard__cell--large u-ellipsis">
        <span class="text is-small is-txtSoftGrey">
          {{ formattedSpatialAggregations}}
        </span>
      </div>
    </div>

    <div class="catalogCard__column">
      <div class="cell cell--large u-ellipsis">
        <span class="text is-small is-txtSoftGrey">
          {{ formattedFrequency }}
        </span>
      </div>
      <div class="cell cell--large u-ellipsis">
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
        return 'default';
      }
      return this.dataset.category.replace(/ /g, '-').toLowerCase();
    }
  },
  methods: {
    onClick (event) {
      event.preventDefault();
      this.$router.push({
        name: 'catalog_detail',
        params: {
          id: this.dataset.id
        },
        query: {
          category: this.dataset.category,
          country: this.dataset.country
        }
      });
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
  cursor: pointer;

  &:hover {
    background-color: $softblue;
    text-decoration: none;

    .catalogCard__title {
      color: $primary-color;
      text-decoration: underline;
    }
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
      padding: 6px;
      overflow: hidden;
      transition: all 0.25s cubic-bezier(0.4, 0.01, 0.165, 0.99);
      border-radius: 2px;
      background-color: $thumbnail__bg-color;
    }
  }
}
</style>
