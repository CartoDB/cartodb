<template>
  <a
    class="button"
    :class="[
      {
        'is-outline': isOutline,
        'reverse-colors': reverseColors,
        'extra-border': extraBorder,
        'is-narrow': narrow,
        'is-big': big,
        'has-arrow': arrow,
        'disabled': disabled
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
    blank: Boolean,
    big: Boolean,
    arrow: Boolean,
    disabled: Boolean
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

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

  &.red {
    background-color: $red--600 !important;
  }

  &.green {
    background-color: $green--400 !important;
  }

  &.is-outline {
    border: 1px solid $button-outline__border-color;
    background: transparent;
    color: $button-outline__color;

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

  &.extra-border {
    border-width: 2px;
  }

  &.is-narrow {
    padding: 6px 16px;
  }

  &.is-big {
    border-radius: 8px;
    padding: 16px 24px;
    font: 600 14px/20px $title__font-family;
  }

  &.has-arrow:after {
    content: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCAyMCAxMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPgogICAgPHBhdGggZD0iTS0yLTdoMjR2MjRILTJ6Ii8+CiAgICA8cGF0aCBmaWxsPSIjRkZGIiBkPSJNMTQuNzA3LjI5M2wtMS40MTQgMS40MTRMMTUuNTg2IDRIMHYyaDE1LjU4NmwtMi4yOTMgMi4yOTMgMS40MTQgMS40MTRMMTkuNDE0IDV6Ii8+CiAgPC9nPgo8L3N2Zz4=);
    margin-left: 12px;
  }

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }
}

.reverse-colors {
  background: $button__color;
  color: $button__bg-color;

  &:hover {
    background-color: $button__color;
  }
}

.noCursor {
  cursor: initial;
}
</style>
