<template>
  <div>
    <div class="quota-headers">
      <div class="quota-cell cell--main">
        <h3 class="title is-caption quota-title">{{title}}</h3>
      </div>

      <div class="quota-labels">
        <div class="quota-cell cell--medium">
          <span class="text is-small is-txtSoftGrey">{{ $t('QuotaSection.header.remaining') }}</span>
        </div>
        <div class="quota-cell cell--medium">
          <span class="text is-small is-txtSoftGrey">{{ $t('QuotaSection.header.used') }}</span>
        </div>
        <div class="quota-cell cell--medium">
          <span class="text is-small is-txtSoftGrey">{{ $t('QuotaSection.header.total') }}</span>
          <!-- <p class="text is-subheader is-txtGrey" :class="{'is-subheader': !isCompact, 'is-caption': isCompact}">{{roundOneDecimal(usedQuota)}} / {{roundOneDecimal(availableQuota)}} {{unit}}</p> -->
        </div>
        <div class="quota-cell cell--small"></div>
      </div>
    </div>
    <div class="quota-container">
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'QuotaContainer',
  props: {
    title: String
  }
};
</script>

<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';

.quota-container {
  // height: 100%;
  // padding: 28px 16px 28px 36px;
  // border: 1px solid $light-grey;
  // border-radius: 2px;
  // background-color: $white;
  display: flex;
  align-items: center;
  width: 100%;
  height: 80px;
  padding: 36px 0;
  background-color: $white;
}

.quota-title {
  margin-bottom: 8px;
}

.quota-headers {
  display: flex;
  justify-content: space-between;
}

.quota-labels {
  display: flex;
}

.quota-cell {
  display: flex;
  position: relative;
  flex-grow: 0;
  flex-shrink: 0;
  align-items: center;
  padding: 0 10px;
  text-overflow: ellipsis;
  white-space: nowrap;

  // &:first-of-type {
  //   padding-left: 0;
  // }

  // &:last-of-type {
  //   padding-right: 0;
  // }
}

.cell--main {
  flex-grow: 1;
  flex-shrink: 1;
  min-width: 320px;
}

.cell--medium {
  width: 120px;
}

.cell--small {
  width: 58px;
}
</style>
