<template>
  <a
    class="button"
    :class="[
      {
        'is-outline': isOutline,
        'reverse-colors': reverseColors,
        'extra-border': extraBorder,
        'is-narrow': narrow
      },
      color
    ]"
    :href="url"
    :target="blank ? '_blank' : ''"
  >
    <slot></slot>
  </a>
</template>

<script>
export default {
  name: 'Button',
  props: {
    url: String,
    isOutline: Boolean,
    reverseColors: Boolean,
    extraBorder: Boolean,
    color: String,
    narrow: Boolean,
    blank: Boolean
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/catalog/variables';

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 16px;
  border-radius: 4px;
  background: $button__bg-color;
  color: $button__color;
  font: 600 12px/16px $title__font-family;
  letter-spacing: 0;
  cursor: pointer;

  &:hover {
    background-color: $button__bg-color--hover;
  }

  &.is-narrow {
    padding: 6px 16px;
  }

  &.red {
    background-color: $red--600;
  }

  &.green {
    background-color: $green--400;
  }
}

.reverse-colors {
  background: $button__color;
  color: $button__bg-color;

  &:hover {
    background-color: darken($button__color, 2);
  }
}

.is-outline {
  border: 1px solid $button-outline__border-color;
  padding: 9px 16px;
  background: transparent;
  color: $button-outline__color;

  &.extra-border {
    border-width: 2px;
  }

  &:hover,
  &:focus {
    background-color: rgba($black, 0.02);
  }

  &.navy-blue {
    border-color: $navy-blue;
    background-color: transparent;
    color: $navy-blue;
  }

  &.noBorder {
    border: none;
  }
}

.noCursor {
  cursor: initial;
}
</style>
