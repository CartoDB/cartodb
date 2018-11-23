<template>
  <div class="dataset-fake-row">
    <div class="cell-placeholder">
      <div class="icon-placeholder"/>
    </div>
    <div class="cell-placeholder cell--main">
      <div class="text-placeholder"/>
    </div>
    <div class="cell-placeholder cell--large">
      <div class="text-placeholder"/>
    </div>
    <div class="cell-placeholder cell--small">
      <div class="text-placeholder"/>
    </div>
    <div class="cell-placeholder cell--small">
      <div class="text-placeholder"/>
    </div>
    <div class="cell-placeholder cell--small">
      <div class="text-placeholder"/>
    </div>
    <div class="cell-placeholder cell--small">
      <div class="text-placeholder"/>
    </div>
    <div class="cell-placeholder cell--quick-actions">
    </div>
  </div>
</template>

<script>
export default {
  name: 'FakeDatasetCard'
};
</script>

<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';

.dataset-fake-row {
  display: flex;
  align-items: center;
  width: 100%;
  height: 80px;
  padding: 22px 2px;
  border-bottom: 1px solid $light-grey;
  background-color: $white;
}

.icon-placeholder {
  width: 36px;
  height: 36px;
  border-radius: 2px;
  background-color: $softblue;
}

.text-placeholder {
  height: 24px;
  background-color: $softblue;
}

.cell-placeholder {
  padding: 0 10px;
}

.cell--main {
  flex-grow: 1;
  flex-shrink: 1;
  min-width: 200px;
}

.cell--large {
  width: 165px;
}

.cell--medium {
  width: 120px;
}

.cell--small {
  width: 80px;
}

.cell--quick-actions {
  padding: 0 24px;
}
</style>
