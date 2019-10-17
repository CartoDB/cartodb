<template>
    <div class="catalogRequestSuccess">
      <img class="catalogRequestSuccess__icon" src="../../assets/icons/catalog/request-success.svg" />
      <p class="catalogRequestSuccess__text text is-small">{{ $t('CatalogDetailPage.requestSuccess')}}</p>
    </div>
</template>

<script>
export default {
  name: 'CatalogRequestSuccess'
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";

.catalogRequestSuccess {
  display: flex;
  align-items: center;
  width: 290px;

  &__icon {
    flex-shrink: 0;
    width: 23px;
    height: 22px;
  }

  &__text {
    margin-left: 24px;
  }
}
</style>
