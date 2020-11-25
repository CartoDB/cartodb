/**
 *  Tooltip.vue
**/
/* template import */
<template src="./tooltip.html"></template>
/* style import */
<style scoped lang="scss" src="./tooltip.scss"></style>
<script>
import TooltipComponent from './tooltip-component/TooltipComponent';

export default {
  name: 'Tooltip',
  components: {
    TooltipComponent
  },
  props: {
    text: {
      type: [String, Number, Boolean],
      required: false
    },
    position: {
      type: String
    },
    margin: {
      type: Number,
      required: false
    },
    multiline: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      visible: false,
      bbox: null
    };
  },
  mounted () {
    if (this.text) {
      this.$el.addEventListener('mouseover', this.show, false);
      this.$el.addEventListener('mouseout', this.hide, false);
    }
  },
  destroyed () {
    this.$el.removeEventListener('mouseover', this.show);
    this.$el.removeEventListener('mouseout', this.hide);
  },
  methods: {
    show () {
      this.bbox = this.$el.getBoundingClientRect();
      this.visible = true;
      window.addEventListener('scroll', this.hide, false);
    },
    hide () {
      this.bbox = null;
      this.visible = false;
      window.removeEventListener('scroll', this.hide);
    }
  },
  watch: {
    text (value) {
      this.text = value;
    }
  }
};
</script>
