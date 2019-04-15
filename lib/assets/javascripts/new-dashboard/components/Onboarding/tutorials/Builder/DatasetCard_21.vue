<template>
  <div class="datasetcard u-width--100">
    <div class="u-flex u-flex__align--center">
      <div class="datasetcard-icon"></div>
      <div class="title-container">
        <h3 class="text is-caption is-txtGrey u-ellipsis" title="Populated places simple">{{content.title}}</h3>
      </div>
    </div>
    <div class="u-flex u-flex__align--center">
      <span class="text is-small is-txtSoftGrey u-mr--24" :title="content.rows">{{content.rows}}</span>
      <span class="text is-small is-txtSoftGrey u-mr--48">{{content.size}}</span>
      <a download :href="content.link" class="button button--ghost button--outline">{{content.button}}</a>
    </div>
  </div>
</template>
<script>
export default {
  name: 'DatasetCard_21',
  props: {
    content: Object
  }
};
</script>
<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.datasetcard {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 80px;
  padding: 0 16px;
  background-color: $white;

  .datasetcard-icon {
    width: 36px;
    height: 36px;
    margin-right: 16px;
    border-radius: 2px;
    background-color: #F2F6F9;
    background-image: url(/assets/1.0.0-assets.dashboard-onboarding-11/images/dots.svg);
    background-repeat: no-repeat;
    background-position: center;
    background-size: 18px;
  }
}
</style>
