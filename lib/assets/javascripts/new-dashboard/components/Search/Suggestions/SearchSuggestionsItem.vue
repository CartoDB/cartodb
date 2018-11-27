<template>
  <a
    :href="visualizationURL"
    class="suggestions__item text is-caption"
    :class="`suggestions__item--${item.type}`"
    @click="onItemClicked">
    {{item.name}}
  </a>
</template>

<script>
import * as Visualization from 'new-dashboard/core/visualization';

export default {
  name: 'SearchSuggestionsItem',
  props: {
    item: Object
  },
  computed: {
    visualizationURL () {
      return Visualization.getURL(this.$props.item, this.$cartoModels);
    }
  },
  methods: {
    onItemClicked () {
      this.$emit('itemClick');
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'stylesheets/new-dashboard/variables';

.suggestions__item {
  display: block;
  position: relative;
  width: 100%;
  margin: 16px 0;
  padding-left: 20px;
  overflow: hidden;
  color: $text-color;
  text-overflow: ellipsis;
  white-space: nowrap;

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    width: 14px;
    height: 100%;
    transform: translate3d(0, -50%, 0);
    background-repeat: no-repeat;
    background-position: center left;
    background-size: contain;
  }
}

.suggestions__item--derived {
  &::after {
    background-image: url('../../../assets/icons/section-title/map.svg');
  }
}

.suggestions__item--table {
  &::after {
    width: 12px;
    background-image: url('../../../assets/icons/section-title/data.svg');
  }
}
</style>
