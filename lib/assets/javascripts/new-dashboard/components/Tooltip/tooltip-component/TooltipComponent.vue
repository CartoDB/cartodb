/**
 *  TooltipComponent.vue
**/
/* template import */
<template src="./tooltip-component.html"></template>
/* style import */
<style scoped lang="scss" src="./tooltip-component.scss"></style>
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
