<template>
  <div class="lds-list-row">
    <div class="lds-column--main-info">
      <div class="lds-list-cell cell cell--start">
      </div>
      <div class="lds-list-cell cell cell--main" @click="changeOrder('name')">
        <span class="text is-small is-txtSoftGrey element-sort"
          :class="{
            'is-active': isOrderApplied('name'),
            'is-reversed': isReverseOrderApplied('name'),
          }">
          Name
        </span>
      </div>
    </div>

    <div class="lds-column--main-info">
      <div class="lds-list-cell cell cell--large" @click="changeOrder('spatial_aggregations')">
        <span class="text is-small is-txtSoftGrey element-sort"
        :class="{
            'is-active': isOrderApplied('spatial_aggregations'),
            'is-reversed': isReverseOrderApplied('spatial_aggregations'),
          }">
          Aggregation
        </span>
      </div>
    </div>

    <div class="lds-column--main-info">
      <div class="lds-list-cell cell cell--large" @click="changeOrder('frequency')">
        <span class="text is-small is-txtSoftGrey element-sort"
          :class="{
            'is-active': isOrderApplied('frequency'),
            'is-reversed': isReverseOrderApplied('frequency'),
          }">
          Frequency
        </span>
      </div>
      <div class="lds-list-cell cell cell--large" @click="changeOrder('source')">
        <span class="text is-small is-txtSoftGrey element-sort"
          :class="{
            'is-active': isOrderApplied('source'),
            'is-reversed': isReverseOrderApplied('source'),
          }">
          Source
        </span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LDSListHeader',
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

.lds-list-row {
  display: flex;
  align-items: center;
  width: 100%;
  margin-bottom: 1px;
  padding: 16px;
  overflow: hidden;
  border-bottom: 1px solid $softblue;
  background-color: $white;
  cursor: default;
}

.cell--start {
  width: 58px;
  height: 100%;
  padding-left: 0;
}

.element-sort {
  &.is-active,
  &:hover {
    color: $text__color;
    cursor: pointer;

    &::after {
      content: '';
      position: absolute;
      width: 14px;
      height: 100%;
      margin-left: 4px;
      transition: all 0.25s cubic-bezier(0.4, 0.01, 0.165, 0.99);
      background-image: url('../../assets/icons/datasets/chevron.svg');
      background-repeat: no-repeat;
      background-position: center;
    }

    &.is-reversed {
      &::after {
        transform: rotate(180deg);
      }
    }
  }
}
</style>
