<template>
<div class="section">
  <h6 class="text is-xsmall is-txtSoftGrey u-tupper letter-spacing">{{ $t('SettingsDropdown.orderMaps') }}</h6>
  <ul class="list">
    <li class="type text is-caption is-txtGrey" v-for="ordering in orderings" :key="ordering.name" :class="{ 'type--selected': isOrderApplied(ordering.order, ordering.direction) }">
      <a class="element" v-if="!ordering.options" :class="{ 'element--selected': isOrderApplied(ordering.order, ordering.direction) }" @click="setOrder(ordering.order, ordering.direction)">
        {{ $t(`SettingsDropdown.order.${ordering.name}`) }}
      </a>

      <template v-else>
        {{ $t(`SettingsDropdown.order.${ordering.name}.title`) }} (
          <span v-for="(option, index) in ordering.options" :key="option">
            <a :key="option" class="element" :class="{ 'element--selected': isOrderApplied(ordering.order, option) }" @click="setOrder(ordering.order, option)">
              {{ $t(`SettingsDropdown.order.${ordering.name}.${option}`) }}
            </a>
            <span v-if="index < ordering.options.length - 1">|</span>
          </span>
        )
      </template>
    </li>
  </ul>
</div>
</template>

<script>
export default {
  name: 'Ordering',
  props: {
    orderings: Array,
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
@import 'new-dashboard/styles/variables';

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
      background-image: url("../../assets/icons/common/check.svg");
      background-repeat: no-repeat;
      background-position: center;
    }
  }
}

.element {
  text-decoration: none;
  cursor: pointer;

  &.element--selected {
    color: $text__color;
    pointer-events: none;
  }
}
</style>
