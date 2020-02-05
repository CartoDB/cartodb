<template>
  <div>
    <router-link
      v-if="isTagType"
      :to="{ name: 'tagSearch', params: { tag: item.name } }"
      :staticRoute="`/dashboard/search/tag/${item.name}`"
      class="suggestions__item text is-caption suggestions__item--tag">
      {{item.name}}
    </router-link>
    <a
      v-else
      :href="item.url || visualizationURL"
      class="suggestions__item text is-caption"
      :class="`suggestions__item--${item.type}`"
      @click="onItemClicked"
      target="_blank"
      rel="noopener noreferrer">
      {{item.name}}
    </a>
  </div>
</template>

<script>
import * as Visualization from 'new-dashboard/core/models/visualization';

export default {
  name: 'SearchSuggestionsItem',
  props: {
    item: Object
  },
  computed: {
    visualizationURL () {
      return Visualization.getURL(this.$props.item, this.$cartoModels);
    },
    isTagType () {
      return this.$props.item.type === 'tag';
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
@import 'new-dashboard/styles/variables';

.suggestions__item {
  display: block;
  position: relative;
  width: 100%;
  padding: 12px 16px 12px 36px;
  overflow: hidden;
  color: $primary-color;
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;

  &:not(:last-child) {
    border-bottom: 1px solid $softblue;
  }

  &:first-of-type {
    border-top: 1px solid $border-color--dark;
  }

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
    text-decoration: underline;
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

.suggestions__item--tag {
  &::after {
    background-image: url('../../../assets/icons/navbar/search/search-tags.svg');
  }
}
</style>
