<template>
  <div class="lds-fake-row">

    <div class="lds-column--main-info">
      <div class="cell-placeholder cell cell--start thumbnail">
        <div class="icon-placeholder"/>
      </div>
      <div class="cell-placeholder cell cell--main">
        <div class="text-placeholder"/>
      </div>
    </div>

    <div class="lds-column--main-info">
      <div class="cell-placeholder cell cell--xlarge">
        <div class="text-placeholder"/>
      </div>
    </div>

    <div class="lds-column--main-info">
      <div class="cell-placeholder cell cell--large">
        <div class="text-placeholder"/>
      </div>
      <div class="cell-placeholder cell cell--large">
        <div class="text-placeholder"/>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LDSFakeCard',
}
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.lds-fake-row {
  display: flex;
  align-items: center;
  width: 100%;
  height: 81px;
  padding: 22px 14px;
  background-color: $white;
}

.cell--start {
  width: 58px;
  height: 100%;
  padding-left: 0;
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

.thumbnail {
  padding-right: 16px;
  padding-left: 6px;
}

</style>
