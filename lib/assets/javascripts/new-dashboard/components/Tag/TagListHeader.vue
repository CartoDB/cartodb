<template>
  <div class="tag__header">
    <div class="viz-column--main-info">
      <div class="cell cell--start">
      </div>
      <div class="cell cell--main">
        <span class="text is-small is-txtSoftGrey">
          {{ $t('TagListHeader.name') }}
        </span>
      </div>
    </div>

    <div class="viz-column--extra-info">
      <div class="viz-column--status">
        <div class="cell cell--large">
        </div>
        <div class="cell cell--xsmall u-txt-right">
          <span class="text is-small is-txtSoftGrey">
            {{ $t('TagListHeader.maps') }}
          </span>
        </div>
        <div class="cell cell--small u-txt-right">
          <span class="text is-small is-txtSoftGrey">
            {{ $t('TagListHeader.datasets') }}
          </span>
        </div>
      </div>
      <div class="viz-column--share"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TagListHeader'
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.tag__header {
  display: flex;
  align-items: center;
  width: 100%;
  margin-bottom: 1px;
  padding: 14px;
  overflow: hidden;
  border-bottom: 1px solid $softblue;
  background-color: $white;
  cursor: default;
}

.cell--start {
  display: flex;
  align-items: center;
  align-self: flex-start;
  width: 58px;
  height: 100%;
}
</style>
