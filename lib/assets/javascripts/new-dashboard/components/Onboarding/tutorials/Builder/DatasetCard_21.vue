<template>
  <div class="datasetcard u-width--100">
    <div class="u-flex u-flex__align--center">
      <img class="icon u-hideMobile" svg-inline src="../../../assets/icons/datasets/data-types/dots.svg" alt="Icon for dots type dataset">
      <div class="title-container">
        <h3 class="text is-caption is-txtGrey u-ellipsis" title="Populated places simple">{{content.title}}</h3>
      </div>
   </div>
   <div class="u-flex u-flex__align--center">
        <span class="text is-small is-txtSoftGrey u-mr--24" title="7,322 rows">{{content.rows}}</span>
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

  .icon {
    width: 100%;
    height: 100%;
    margin-right: 16px;
    padding: 8px;
    border-radius: 2px;
    background-color: $softblue;
  }
}
</style>
