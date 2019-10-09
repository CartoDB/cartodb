<template>
  <div class="catalogCardFake">

    <div class="catalogCardFake__column u-flex u-flex__align--center">
      <div class="catalogCardFake__cell cell-placeholder cell thumbnail">
        <div class="icon-placeholder"/>
      </div>
      <div class="cell-placeholder cell cell--main">
        <div class="text-placeholder"/>
      </div>
    </div>

    <div class="catalogCardFake__column">
      <div class="cell-placeholder cell cell--xlarge">
        <div class="text-placeholder"/>
      </div>
    </div>

    <div class="catalogCardFake__column">
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
  name: 'CatalogCardFake'
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.catalogCardFake {
  display: flex;
  align-items: center;
  width: 100%;
  height: 81px;
  padding: 22px 14px;
  background-color: $white;

  &__column {
    display: flex;
    flex: 0 0 33.3334%;
    justify-content: center;
    max-width: 33.3334%;
  }

  &__cell {
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

  .thumbnail {
    padding-right: 16px;
    padding-left: 6px;
  }
}
</style>
