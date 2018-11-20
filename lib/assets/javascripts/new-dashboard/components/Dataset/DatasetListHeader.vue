<template>
  <div class="dataset-list-row">
    <div class="dataset-list-cell cell--start">
    </div>
    <div class="dataset-list-cell cell--main" @click="changeOrder('name')">
      <span class="text element-sort is-small is-txtSoftGrey"
            :class="{ 'is-active': isOrderApplied('name'), 'is-reversed': isReverseOrderApplied('name') }">
        {{ $t(`datasetListHeader.name`) }}
      </span>
    </div>
    <div class="dataset-list-cell cell--large" @click="changeOrder('updated_at')">
      <span class="text element-sort is-small is-txtSoftGrey"
            :class="{ 'is-active': isOrderApplied('updated_at'), 'is-reversed': isReverseOrderApplied('updated_at') }">
        {{ $t(`datasetListHeader.lastModified`) }}
      </span>
    </div>
    <div class="dataset-list-cell cell--small" @click="changeOrder('rows')">
      <span class="text element-sort is-small is-txtSoftGrey"
            :class="{ 'is-active': isOrderApplied('rows'), 'is-reversed': isReverseOrderApplied('rows') }">
        {{ $t(`datasetListHeader.rows`) }}
      </span>
    </div>
    <div class="dataset-list-cell cell--small" @click="changeOrder('size')">
      <span class="text element-sort is-small is-txtSoftGrey"
            :class="{ 'is-active': isOrderApplied('size'), 'is-reversed': isReverseOrderApplied('size') }">
        {{ $t(`datasetListHeader.size`) }}
      </span>
    </div>
    <div class="dataset-list-cell cell--small" @click="changeOrder('usage')">
      <span class="text element-sort is-small is-txtSoftGrey"
            :class="{ 'is-active': isOrderApplied('usage'), 'is-reversed': isReverseOrderApplied('usage') }">
        {{ $t(`datasetListHeader.usage`) }}
      </span>
    </div>
    <div class="dataset-list-cell cell--small cell--privacy" @click="changeOrder('privacy')">
      <span class="text element-sort is-small is-txtSoftGrey"
            :class="{ 'is-active': isOrderApplied('privacy'), 'is-reversed': isReverseOrderApplied('privacy') }">
        {{ $t(`datasetListHeader.privacy`) }}
      </span>
    </div>
    <div class="dataset-list-cell cell--end"></div>
  </div>
</template>

<script>
export default {
  name: 'DatasetListHeader',
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
