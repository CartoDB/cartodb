<template>
  <div class="map-list-row">
    <div class="map-list-cell cell cell--start">
    </div>
    <div class="map-list-cell cell cell--main" @click="changeOrder('name')">
      <span class="text element-sort is-small is-txtSoftGrey"
            :class="{ 'is-active': isOrderApplied('name'), 'is-reversed': isReverseOrderApplied('name') }">
        {{ $t(`MapListHeader.name`) }}
      </span>
    </div>
    <div class="map-list-cell cell cell--large" @click="changeOrder('updated_at')">
      <span class="text element-sort is-small is-txtSoftGrey"
            :class="{ 'is-active': isOrderApplied('updated_at'), 'is-reversed': isReverseOrderApplied('updated_at') }">
        {{ $t(`MapListHeader.lastModified`) }}
      </span>
    </div>
    <div class="map-list-cell cell cell--large" @click="changeOrder('mapviews')">
      <span class="text element-sort is-small is-txtSoftGrey"
            :class="{ 'is-active': isOrderApplied('mapviews'), 'is-reversed': isReverseOrderApplied('mapviews') }">
        {{ $t(`MapListHeader.views`) }}
      </span>
    </div>
    <div class="map-list-cell cell cell--medium cell--privacy" @click="changeOrder('privacy')">
      <span class="text element-sort is-small is-txtSoftGrey"
            :class="{ 'is-active': isOrderApplied('privacy'), 'is-reversed': isReverseOrderApplied('privacy') }">
        {{ $t(`MapListHeader.privacy`) }}
      </span>
    </div>
    <div class="map-list-cell cell cell--end"></div>
  </div>
</template>

<script>
export default {
  name: 'CondensedMapHeader',
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
      this.$emit('orderChanged', { order, direction });
    }
  }
};
</script>

<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';

.map-list-row {
  display: flex;
  align-items: center;
  width: 100%;
  margin-bottom: 0;
  padding: 8px 14px;
  overflow: hidden;
  background-color: $white;
}

.map-list-cell {
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
  width: 68px;
  height: 100%;
}

.cell--end {
  width: 44px;
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
