<template>
  <div class="basic-legend is-small">
    <p class="legend-title is-semibold">{{ title }}</p>
  </div>
</template>

<script>
export default {
  name: 'BasicLegend',
  props: {
    title: String
  }
};
</script>

<style lang="scss" scoped>
// .basic-legend {}
</style>
