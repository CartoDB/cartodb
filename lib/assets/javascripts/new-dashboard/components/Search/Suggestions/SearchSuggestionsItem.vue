<template>
  <a
    :href="item.url || visualizationURL"
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
  padding: 16px 16px 16px 36px;
  overflow: hidden;
  color: $text-color;
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 14px;
    width: 12px;
    height: 100%;
    transform: translate3d(0, -50%, 0);
    background-repeat: no-repeat;
    background-position: center left;
    background-size: contain;
  }
}

.suggestions--active {
  .suggestions__item {
    background-color: rgba($primary-color, 0.05);
    color: #1785FB;
    text-decoration: none;
  }
}

.suggestions__item--derived {
  &::after {
    background-image: url('../../../assets/icons/navbar/search/search-map.svg');
  }
}

.suggestions__item--table {
  &::after {
    background-image: url('../../../assets/icons/navbar/search/search-data.svg');
  }
}
</style>
