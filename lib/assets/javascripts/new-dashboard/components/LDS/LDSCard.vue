<template>
  <a href=""
     target="_blank"
     class="lds-row">

    <div class="lds-column--main-info">
      <div class="lds-list-cell cell cell--start">
        <div class="lds-categoryIcon"></div>
      </div>
      <div class="lds-list-cell cell cell--main u-flex u-flex__direction--column">
        <span class="text is-caption is-semibold is-txtGrey row-title u-ellipsis">
          {{dataset.name}}
        </span>
      </div>
    </div>

    <div class="lds-column--main-info">
      <div class="lds-list-cell cell cell--xlarge u-flex">
        <span class="text is-small is-txtSoftGrey u-ellipsis">
          {{dataset.spatial_aggregations}}
        </span>
      </div>
    </div>

    <div class="lds-column--main-info">
      <div class="lds-list-cell cell cell--large">
        <span class="text is-small is-txtSoftGrey lds-text-frequency">
          {{dataset.frequency}}
        </span>
      </div>
      <div class="lds-list-cell cell cell--large">
        <span class="text is-small is-txtSoftGrey">
          {{dataset.source}}
        </span>
      </div>
    </div>
  </a>
</template>

<script>
export default {
  name: 'LDSCard',
  props: {
    dataset: Object
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.lds-row {
  display: flex;
  align-items: center;
  width: 100%;
  margin-bottom: 1px;
  padding: 16px;
  overflow: hidden;
  border-bottom: 1px solid $softblue;
  background-color: $white;

  &:hover {
    background-color: $softblue;
    text-decoration: none;

    .row-title {
      color: $primary-color;
      text-decoration: underline;
    }
  }

  .cell--start {
    width: 58px;
    height: 100%;
    padding-left: 0;
  }
}

.lds-categoryIcon {
  width: 36px;
  height: 36px;
  margin-right: 6px;
  padding: 9px;
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.4, 0.01, 0.165, 0.99);
  border-radius: 2px;
  background-color: #EBEEF5;
}

.lds-text-frequency {
  text-transform: capitalize;
}

</style>
