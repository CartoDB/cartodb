<template>
  <div class="condensed-fake-row">
    <div class="viz-column--main-info">
      <div class="cell-placeholder cell--icon">
        <div class="icon-placeholder"/>
      </div>
      <div class="cell-placeholder cell--main">
        <div class="text-placeholder"/>
      </div>
    </div>
    <div class="viz-column--extra-info">
      <div class="viz-column--statusL u-flex__justify--between">
        <div class="cell-placeholder cell--medium">
          <div class="text-placeholder"/>
        </div>
        <div class="cell-placeholder cell--large">
          <div class="text-placeholder"/>
        </div>
        <div class="cell-placeholder cell--xsmall">
          <div class="text-placeholder"/>
        </div>
      </div>
      <div class="viz-column--shareS">
        <div class="cell-placeholder cell--small">
          <div class="text-placeholder"/>
        </div>
        <div class="cell-placeholder cell--quick-actions">
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CondensedMapCardFake'
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.condensed-fake-row {
  display: flex;
  align-items: center;
  width: 100%;
  height: 80px;
  padding: 0 14px;
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
  padding: 0 10px;
}

.cell--icon {
  padding: 0 10px 0 0;
}

.cell--quick-actions {
  padding: 0 18px;
}
</style>
