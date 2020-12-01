/**
 *  Tooltip.vue
**/
<template>
  <div class="tooltip-container">
    <slot name="tooltip">
      <TooltipComponent v-if="visible"
        :bbox="bbox"
        :margin="margin"
        :text="text"
        :position="position"
        :multiline="multiline">
      </TooltipComponent>
    </slot>

    <slot></slot>
  </div>
</template>

<style scoped lang="scss">
  .tooltip-container {
    display: inline-flex;
  }
</style>

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
