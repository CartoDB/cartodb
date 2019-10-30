<template>
  <div class="kuvizFakeCard">
    <div class="kuvizFakeCard__column--main">
      <div class="kuvizFakeCard__cell cell cell--icon">
        <div class="icon-placeholder"/>
      </div>
      <div class="cell cell--main">
        <div class="text-placeholder"/>
      </div>
    </div>

    <div class="kuvizFakeCard__column--extra">
      <div class="cell cell--xlarge u-ellipsis">
        <div class="text-placeholder"/>
      </div>
      <div class="cell cell--medium u-ellipsis">
        <div class="text-placeholder"/>
      </div>
      <div class="cell cell--last"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'KuvizFakeCard'
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.kuvizFakeCard {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 16px;
  overflow: hidden;
  border-bottom: 1px solid $softblue;
  background-color: $white;
  cursor: default;

  &__column {
    display: flex;
    justify-content: center;

    &--main {
      display: flex;
      flex: 0 0 58.3331%;
      align-items: center;
      justify-content: center;
      max-width: 58.3331%;
    }

    &--extra {
      display: flex;
      flex: 0 0 41.6665%;
      align-items: center;
      justify-content: space-between;
      max-width: 41.6665%;
    }
  }

  &__cell {
    width: 58px;
    height: 100%;
    padding-left: 0;

    &--large {
      flex-grow: 1;
      flex-shrink: 1;
      width: 280px;
    }

    &--icon {
      padding-right: 16px;
      padding-left: 6px;
    }
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
}
</style>
