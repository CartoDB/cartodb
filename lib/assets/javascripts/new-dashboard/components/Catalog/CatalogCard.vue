<template>
  <a href=""
     target="_blank"
     class="catalogCard">

    <div class="catalogCard__column">
      <div class="catalogCard__cell cell">
        <div class="catalogCard__icon"></div>
      </div>
      <div class="cell cell--main u-flex u-flex__align--center">
        <span class="text is-caption is-semibold is-txtGrey row-title u-ellipsis catalogCard__title">
          {{dataset.name}}
        </span>
      </div>
    </div>

    <div class="catalogCard__column">
      <div class="cell cell--xlarge">
        <span class="text is-small is-txtSoftGrey u-ellipsis">
          {{dataset.spatial_aggregations}}
        </span>
      </div>
    </div>

    <div class="catalogCard__column">
      <div class="cell cell--large">
        <span class="text is-small is-txtSoftGrey">
          {{dataset.frequency}}
        </span>
      </div>
      <div class="cell cell--large">
        <span class="text is-small is-txtSoftGrey">
          {{dataset.source}}
        </span>
      </div>
    </div>
  </a>
</template>

<script>
export default {
  name: 'CatalogCard',
  props: {
    dataset: Object
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.catalogCard {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 16px;
  overflow: hidden;
  border-bottom: 1px solid $softblue;
  background-color: $white;

  &:hover {
    background-color: $softblue;
    text-decoration: none;
  }

  &__title {
    color: $primary-color;
    text-decoration: underline;
  }

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

  &__icon {
    width: 36px;
    height: 36px;
    margin-right: 6px;
    padding: 9px;
    overflow: hidden;
    transition: all 0.25s cubic-bezier(0.4, 0.01, 0.165, 0.99);
    border-radius: 2px;
    background-color: $softblue;
  }
}
</style>
