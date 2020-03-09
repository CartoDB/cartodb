<template>
  <div class="map-list-row">
    <div class="viz-column--main-info">
      <div class="cell cell--start">
      </div>
      <div class="cell cell--main" @click="changeOrder('name')">
        <span class="text is-small is-txtSoftGrey"
              :class="{
                'is-active': isOrderApplied('name'),
                'is-reversed': isReverseOrderApplied('name'),
                'element-sort': isSortable
              }">
          {{ $t(`MapListHeader.name`) }}
        </span>
      </div>
    </div>

    <div class="viz-column--extra-info">
      <div class="viz-column--statusL">
        <div class="cell cell--medium u-p--0">
          <span class="text is-small is-txtSoftGrey"
                :class="{
                  'element-sort': false
                }">
            {{ $t(`MapListHeader.type`) }}
          </span>
        </div>
        <div class="cell cell--large" @click="changeOrder('updated_at')">
          <span class="text is-small is-txtSoftGrey"
                :class="{
                  'is-active': isOrderApplied('updated_at'),
                  'is-reversed': isReverseOrderApplied('updated_at'),
                  'element-sort': isSortable
                }">
            {{ $t(`MapListHeader.lastModified`) }}
          </span>
        </div>
        <div class="cell cell--xsmall u-txt-right u-p--0" @click="changeOrder('mapviews')" v-if="showViews">
          <span class="text is-small is-txtSoftGrey"
                :class="{
                  'is-active': isOrderApplied('mapviews'),
                  'is-reversed': isReverseOrderApplied('mapviews'),
                  'element-sort': isSortable
                }">
            {{ $t(`MapListHeader.views`) }}
          </span>
        </div>
      </div>

      <div class="viz-column--shareS">
        <div class="cell cell--small" @click="changeOrder('privacy')">
          <span class="text is-small is-txtSoftGrey"
                :class="{
                  'is-active': isOrderApplied('privacy'),
                  'is-reversed': isReverseOrderApplied('privacy'),
                  'element-sort': isSortable
                }">
            {{ $t(`MapListHeader.privacy`) }}
          </span>
        </div>
        <div class="cell cell--end"></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CondensedMapHeader',
  props: {
    order: String,
    orderDirection: String,
    isSortable: {
      type: Boolean,
      default: true
    },
    showViews: {
      type: Boolean,
      default: true
    }
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
@import 'new-dashboard/styles/variables';

.map-list-row {
  display: flex;
  align-items: center;
  width: 100%;
  margin-bottom: 1px;
  padding: 14px;
  overflow: hidden;
  border-bottom: 1px solid $softblue;
  background-color: $white;
  cursor: default;
}

.cell--start {
  display: flex;
  align-items: center;
  align-self: flex-start;
  width: 58px;
  height: 100%;
}

.cell--end {
  width: 38px;
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
