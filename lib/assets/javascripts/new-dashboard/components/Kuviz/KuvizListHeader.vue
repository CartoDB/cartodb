<template>
  <div class="kuvizListHeader">
    <div class="kuvizListHeader__column--main">
      <div class="kuvizListHeader__cell cell">
        <div class="kuvizListHeader__icon"></div>
      </div>
      <div class="cell cell--main u-flex u-flex__align--center">
        <span class="text is-small is-txtSoftGrey">
          {{ $t('KuvizListHeader.name') }}
        </span>
      </div>
    </div>

    <div class="kuvizListHeader__column--extra">
      <div class="cell cell--xlarge u-ellipsis">
        <span class="text is-small is-txtSoftGrey">
          {{ $t('KuvizListHeader.lastModified') }}
        </span>
      </div>
      <div class="cell cell--medium u-ellipsis">
        <span class="text is-small is-txtSoftGrey">
          {{ $t('KuvizListHeader.privacy') }}
        </span>
      </div>
      <div class="cell cell--last kuvizListHeader__cell--last"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'KuvizListHeader'
}
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.kuvizListHeader {
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

    &--last {
      width: 34px;
    }
  }

  &__icon {
    display: flex;
    width: 48px;
  }
}
</style>