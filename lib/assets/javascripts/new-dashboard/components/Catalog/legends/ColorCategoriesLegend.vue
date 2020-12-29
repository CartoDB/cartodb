<template>
  <div class="color-categories-legend is-small">
    <p class="legend-title is-semibold">{{ title }}</p>
    <div class="legend-item" v-for="category in categories" :key="category.name">
      <div class="legend-item-bullet" :style="{ background: category.color }"></div>
      <p class="legend-item-text">{{ category.name }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ColorCategoriesLegend',
  props: {
    title: String,
    categories: Array
  }
};
</script>

<style lang="scss" scoped>
.color-categories-legend {

  .legend-title {
    margin-bottom: 12px;
  }

  .legend-item {
    display: flex;
    align-items: center;
    margin-top: 8px;

    .legend-item-bullet {
      width: 12px;
      height: 12px;
      min-width: 12px;
      min-height: 12px;
      border-radius: 12px;
      margin: 4px 12px 4px 4px;
    }

    .legend-item-text {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}
</style>
