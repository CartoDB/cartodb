<template>
  <div class="color-bins-legend is-small">
    <p class="legend-title is-semibold">{{ title }}</p>
    <div class="legend-range">
      <p>{{ min }}</p>
      <p>{{ max }}</p>
    </div>
    <div class="legend-colors">
      <div v-for="bin in bins" :key="bin.color" :style="{
        background: bin.color,
        width: `${100 / bins.length}%`
      }">
      </div>
    </div>
    <p class="legend-avg">
      {{ avg }} AVG
    </p>
  </div>
</template>

<script>
export default {
  name: 'ColorBinsLegend',
  props: {
    title: String,
    min: String,
    max: String,
    avg: String,
    bins: Array
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.color-bins-legend {
  color: $neutral--700;

  .legend-title {
    margin-bottom: 12px;
  }

  .legend-range {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
  }

  .legend-colors {
    display: flex;
    height: 8px;
    border-radius: 4px;
    overflow: hidden;
  }

  .legend-avg {
    display: flex;
    justify-content: center;
    margin-top: 6px;
    color: #6f777c;
  }
}
</style>
