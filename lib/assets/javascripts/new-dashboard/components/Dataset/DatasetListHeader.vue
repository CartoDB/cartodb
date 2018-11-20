<template>
  <div class="dataset-list-row">
    <div class="dataset-list-cell cell--start">
    </div>
    <div class="dataset-list-cell cell--main" @click="changeOrder('name')">
      <span class="text element-sort is-small is-txtSoftGrey"
            :class="{ 'is-active': isOrderApplied('name'), 'is-reversed': isReversedOrderApplied('name') }">
        {{ $t(`datasetListHeader.name`) }}
      </span>
    </div>
    <div class="dataset-list-cell cell--large" @click="changeOrder('updated_at')">
      <span class="text element-sort is-small is-txtSoftGrey"
            :class="{ 'is-active': isOrderApplied('updated_at'), 'is-reversed': isReversedOrderApplied('updated_at') }">
        {{ $t(`datasetListHeader.lastModified`) }}
      </span>
    </div>
    <div class="dataset-list-cell cell--small" @click="changeOrder('rows')">
      <span class="text element-sort is-small is-txtSoftGrey"
            :class="{ 'is-active': isOrderApplied('rows'), 'is-reversed': isReversedOrderApplied('rows') }">
        {{ $t(`datasetListHeader.rows`) }}
      </span>
    </div>
    <div class="dataset-list-cell cell--small" @click="changeOrder('size')">
      <span class="text element-sort is-small is-txtSoftGrey"
            :class="{ 'is-active': isOrderApplied('size'), 'is-reversed': isReversedOrderApplied('size') }">
        {{ $t(`datasetListHeader.size`) }}
      </span>
    </div>
    <div class="dataset-list-cell cell--small" @click="changeOrder('usage')">
      <span class="text element-sort is-small is-txtSoftGrey"
            :class="{ 'is-active': isOrderApplied('usage'), 'is-reversed': isReversedOrderApplied('usage') }">
        {{ $t(`datasetListHeader.usage`) }}
      </span>
    </div>
    <div class="dataset-list-cell cell--small cell--privacy" @click="changeOrder('privacy')">
      <span class="text element-sort is-small is-txtSoftGrey"
            :class="{ 'is-active': isOrderApplied('privacy'), 'is-reversed': isReversedOrderApplied('privacy') }">
        {{ $t(`datasetListHeader.privacy`) }}
      </span>
    </div>
    <div class="dataset-list-cell cell--end"></div>
  </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'DatasetListHeader',
  methods: {
    changeOrder (order, orderDirection) {
      if (this.currentOrder === order) {
        return this.setOrder(
          order,
          this.getOppositeOrderDirection(this.currentOrderDirection)
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
      return order === this.currentOrder;
    },

    isReversedOrderApplied (order) {
      return order === this.currentOrder && this.currentOrderDirection === 'asc';
    },

    setOrder (order, direction = 'desc') {
      this.$emit('changeOrder', { order, direction });
    }
  },
  computed: mapState({
    currentOrder: state => state.datasets.order,
    currentOrderDirection: state => state.datasets.orderDirection
  })
};
</script>

<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';

.dataset-list-row {
  display: flex;
  align-items: center;
  width: 100%;
  margin-bottom: 0;
  padding: 8px 14px;
  overflow: hidden;
  background-color: $white;
}

.dataset-list-cell {
  position: relative;
  flex-grow: 0;
  flex-shrink: 0;
  padding: 0 10px;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:first-of-type {
    padding-left: 0;
  }

  &:last-of-type {
    padding-right: 0;
  }
}

.cell--start {
  display: flex;
  align-items: center;
  align-self: flex-start;
  width: 46px;
  height: 100%;
}

.cell--end {
  width: 34px;
}

.cell--main {
  flex-grow: 1;
  flex-shrink: 1;
  min-width: 200px;
}

.cell--large {
  width: 165px;
}

.cell--medium {
  width: 120px;
}

.cell--small {
  width: 80px;
}

.cell--privacy {
  display: flex;
  align-items: center;
}

.element-sort {
  &.is-active,
  &:hover {
    color: $text-color;
    cursor: pointer;

    &::after {
      content: '';
      position: absolute;
      width: 14px;
      height: 100%;
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
