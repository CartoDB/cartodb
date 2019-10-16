<template>
  <div class="catalogListHeader">
    <div class="catalogListHeader__column">
      <div class="catalogListHeader__cell cell">
      </div>
      <div class="cell cell--main">
        <span class="text is-small is-txtSoftGrey catalogListHeader__sort"
          :class="{
            'is-active': isOrderApplied('name'),
            'is-reversed': isReverseOrderApplied('name'),
          }">
          {{ $t('CatalogListHeader.name') }}
        </span>
      </div>
    </div>

    <div class="catalogListHeader__column">
      <div class="cell catalogCard__cell--large">
        <span class="text is-small is-txtSoftGrey catalogListHeader__sort"
        :class="{
            'is-active': isOrderApplied('spatial_aggregations'),
            'is-reversed': isReverseOrderApplied('spatial_aggregations'),
          }">
          {{ $t('CatalogListHeader.aggregation') }}
        </span>
      </div>
    </div>

    <div class="catalogListHeader__column">
      <div class="cell cell--large">
        <span class="text is-small is-txtSoftGrey catalogListHeader__sort"
          :class="{
            'is-active': isOrderApplied('frequency'),
            'is-reversed': isReverseOrderApplied('frequency'),
          }">
          {{ $t('CatalogListHeader.frequency') }}
        </span>
      </div>
      <div class="cell cell--large">
        <span class="text is-small is-txtSoftGrey catalogListHeader__sort"
          :class="{
            'is-active': isOrderApplied('source'),
            'is-reversed': isReverseOrderApplied('source'),
          }">
          {{ $t('CatalogListHeader.source') }}
        </span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CatalogListHeader',
  props: {
    order: String,
    orderDirection: String
  },
  methods: {
    changeOrder (order) {
      if (this.order === order) {
        return this.setOrder(
          order,
          this.getOppositeOrderDirection(this.orderDirection)
        );
      }

      this.setOrder(order);
    },
    getOppositeOrderDirection (order) {
      if (order === 'desc') {
        return 'asc';
      }

      if (order === 'asc') {
        return 'desc';
      }
    },
    isOrderApplied (order) {
      return order === this.order;
    },

    isReverseOrderApplied (order) {
      return order === this.order && this.orderDirection === 'asc';
    },
    setOrder (order, direction = 'desc') {
      this.$emit('changeOrder', { order, direction });
    }
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.catalogListHeader {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 16px;
  overflow: hidden;
  border-bottom: 1px solid $softblue;
  background-color: $white;
  cursor: default;

  &__column {
    display: flex;
    flex: 0 0 33.3334%;
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
  }
}

.catalogListHeader__sort {
  &.is-active,
  &:hover {
    color: $text__color;
    cursor: pointer;
  }
}
</style>
