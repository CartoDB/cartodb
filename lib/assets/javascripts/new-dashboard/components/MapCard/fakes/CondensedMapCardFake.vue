<template>
  <div class="condensed-fake-row">
    <div class="cell-placeholder">
      <div class="icon-placeholder"/>
    </div>
    <div class="cell-placeholder cell--main">
      <div class="text-placeholder"/>
    </div>
    <div class="cell-placeholder cell--large">
      <div class="text-placeholder"/>
    </div>
    <div class="cell-placeholder cell--large">
      <div class="text-placeholder"/>
    </div>
    <div class="cell-placeholder cell--medium">
      <div class="text-placeholder"/>
    </div>
    <div class="cell-placeholder cell--quick-actions">
    </div>
  </div>
</template>

<script>
export default {
  name: 'CondensedMapCardFake'
};
</script>

<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';

.condensed-fake-row {
  display: flex;
  align-items: center;
  width: 100%;
  height: 80px;
  padding: 22px 14px;
  background-color: $white;
}

.icon-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 2px;
  background-color: $softblue;
}

.text-placeholder {
  height: 24px;
  background-color: $softblue;
}

.cell-placeholder {
  padding: 0 12px;
}

.cell--main {
  flex-grow: 1;
  flex-shrink: 1;
  min-width: 200px;
}

.cell--large {
  width: 150px;
}

.cell--medium {
  width: 120px;
}

.cell--quick-actions {
  padding: 0 24px;
}
</style>
