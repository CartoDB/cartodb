/**
 *  TooltipComponent.vue
**/
<template>
  <transition appear>
    <div class="tooltip-component-container"
      v-portal="'#tooltip-portal'"
      ref="tooltip"
      :style="getPosition"
      :class="[position, { multiline }]">
      <p class="text is-grey is-small" v-html="text"></p>
    </div>
  </transition>
</template>

<style scoped lang="scss">
  @import "new-dashboard/styles/variables";

  .tooltip-component-container {
    $tooltip-arrow-icon-size: 8px;
    $tooltip-marging: 12px;
    $tooltip-multiline-width: 300px;
    $tooltip-multiline-line-height: 1.2;

    position: fixed;
    z-index: 2000;
    max-width: $tooltip-multiline-width;
    height: auto;
    padding: 6px 10px;
    border: 1px solid $neutral--200;
    background-color: #FFF;
    border-radius: 3px;
    pointer-events: none;

    &:after {
      content: '';
      position: absolute;
      bottom: -5px;
      left: calc(#{$tooltip-arrow-icon-size} * 1.5);
      width: $tooltip-arrow-icon-size;
      height: $tooltip-arrow-icon-size;
      transform: rotate(45deg);
      border: 1px solid $neutral--200;
      border-top: none;
      border-left: none;
      border-radius: 2px;
      background-color: #FFF;
    }

    p {
      width: 100%;
      line-height: $tooltip-multiline-line-height;
      white-space: normal;
      overflow: hidden;
      text-overflow: unset;
      margin: 0;
      padding: 0;
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
      letter-spacing: normal;
    }

    &.visible {
      opacity: 1;
    }

    &.top-left {
      transform: translate3d(-100%, 0, 0);

      &:after {
        left: unset;
        right: calc(#{$tooltip-arrow-icon-size} * 1.5);
      }
    }

    &.top-right {
      transform: translate3d(0, calc(-2 * #{$tooltip-arrow-icon-size}), 0);
    }

    &.bottom-right {
      transform: translate3d(0, calc(#{$tooltip-arrow-icon-size} / 2), 0);

      &:after {
        bottom: unset;
        top: -5px;
        transform: rotate(225deg);
      }
    }

    &.bottom-left {
      transform: translate3d(-100%, calc(#{$tooltip-arrow-icon-size} / 2), 0);

      &:after {
        bottom: unset;
        left: unset;
        top: -5px;
        right: calc(#{$tooltip-arrow-icon-size} * 1.5);
        transform: rotate(225deg);
      }
    }
  }

  .v-leave { opacity: 1; }
  .v-leave-active { transition: opacity 0.25s; }
  .v-leave-to { opacity: 0; }
  .v-enter { opacity: 0; }
  .v-enter-active  { transition: opacity 0.25s 1s; }
  .v-enter-to { opacity: 1; }
</style>
<script>
import portal from 'new-dashboard/directives/portal';

const ARROW_OFFSET = 8;

export default {
  name: 'TooltipComponent',
  mixins: [portal],
  props: {
    bbox: {
      required: false
    },
    text: {
      type: [String, Number],
      required: true
    },
    position: {
      type: String,
      default: 'top',
      validator (value) {
        const positions = [
          'top-left',
          'top-right',
          'bottom-right',
          'bottom-left'
        ];
        return positions.indexOf(value) !== -1;
      }
    },
    margin: {
      type: Number,
      default: 12,
      required: false
    },
    multiline: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    getPosition () {
      const position = {};

      if (this.position.match(/top/ig)) {
        position.top = `${this.bbox.bottom - this.bbox.height - 2 * ARROW_OFFSET}px`;
      } else {
        position.top = `${this.bbox.top + this.bbox.height}px`;
      }

      if (this.position.match(/right/ig)) {
        position.left = `${this.bbox.left + (this.bbox.width / 2) - (ARROW_OFFSET * 2)}px`;
      } else {
        position.left = `${this.bbox.left + (this.bbox.width / 2) + (ARROW_OFFSET * 2)}px`;
      }

      return position;
    }
  }
};
</script>
