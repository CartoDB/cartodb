<template>
<div class="section">
  <h6 class="text is-xsmall is-txtSoftGrey u-tupper letter-spacing">{{ $t('FilterDropdown.orderMaps') }}</h6>
  <ul class="list">
    <li class="type text is-caption is-txtGrey" :class="{ 'type--selected': isOrderApplied('updated_at') }">
      {{ $t('FilterDropdown.order.date.title') }}  (
        <a href="javascript:void(0)" class="element" :class="{ 'element--selected': isOrderApplied('updated_at', 'desc') }" @click="setOrder('updated_at', 'desc')">
          {{ $t('FilterDropdown.order.date.newest') }}
        </a> |
        <a href="javascript:void(0)" class="element" :class="{ 'element--selected': isOrderApplied('updated_at', 'asc') }" @click="setOrder('updated_at', 'asc')">
          {{ $t('FilterDropdown.order.date.oldest') }}
        </a>
      )
    </li>
    <li class="type text is-caption is-txtGrey" :class="{ 'type--selected': isOrderApplied('name') }">
      {{ $t('FilterDropdown.order.alphabetical.title') }} (
        <a href="javascript:void(0)" class="element" :class="{ 'element--selected': isOrderApplied('name', 'asc') }" @click="setOrder('name', 'asc')">
          {{ $t('FilterDropdown.order.alphabetical.A-Z') }}
        </a> |
        <a href="javascript:void(0)" class="element" :class="{ 'element--selected': isOrderApplied('name', 'desc') }" @click="setOrder('name', 'desc')">
          {{ $t('FilterDropdown.order.alphabetical.Z-A') }}
        </a>
      )
    </li>
    <li class="type text is-caption is-txtGrey" :class="{ 'type--selected': isOrderApplied('mapviews', 'desc') }">
      <a href="javascript:void(0)" class="element" :class="{ 'element--selected': isOrderApplied('mapviews', 'desc') }" @click="setOrder('mapviews', 'desc')">
        {{ $t('FilterDropdown.order.views') }}
      </a>
    </li>
  </ul>
</div>
</template>

<script>
export default {
  name: 'MapsOrdering',
  props: {
    order: String,
    orderDirection: String
  },
  methods: {
    isOrderApplied (order, direction) {
      return direction
        ? (this.$props.order === order) && (this.$props.orderDirection === direction)
        : this.$props.order === order;
    },

    setOrder (order, direction) {
      this.$emit('orderChanged', { order, direction });
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'stylesheets/new-dashboard/variables';

.section {
  padding: 24px 12px 24px 36px;
  border-bottom: none;
  background-color: #FFF;
  background-color: $softblue;
}

.list {
  margin-top: 8px;
}

.type {
  margin-bottom: 8px;

  &:last-of-type {
    margin-bottom: 0;
  }

  &.type--selected {
    position: relative;

    &::before {
      content: "";
      position: absolute;
      top: 50%;
      left: -22px;
      width: 14px;
      height: 14px;
      transform: translateY(-50%);
      background-image: url("../../../assets/icons/common/check.svg");
      background-repeat: no-repeat;
      background-position: center;
    }
  }
}

.element {
  text-decoration: none;

  &.element--selected {
    color: $text-color;
    pointer-events: none;
  }
}
</style>
