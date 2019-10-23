<template>
    <div class="catalogueRequestSuccess">
      <div class="catalogueRequestSuccess__icon">
         <img svg-inline src="../../assets/icons/catalogue/request-success.svg" />
      </div>
      <p ref="catalogueRequestSuccessText" class="catalogueRequestSuccess__text text is-small">{{ $t('CatalogueDetailPage.requestSuccess')}}</p>
    </div>
</template>

<script>
export default {
  name: 'CatalogueRequestSuccess',
  mounted () {
    this.$refs.catalogueRequestSuccessText.classList.add('animate');
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";

.catalogueRequestSuccess {
  display: flex;
  align-items: center;
  width: 290px;

  &__icon {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    margin-top: -4px;

    .circle-path {
      animation: dash 0.5s linear forwards;
      animation-delay: 0s;
      stroke-dasharray: 80;
      stroke-dashoffset: 80;
    }

    .check-path {
      animation: dash 0.5s linear forwards;
      animation-delay: 0s;
      stroke-dasharray: 35;
      stroke-dashoffset: 35;
    }
  }

  &__text {
    margin-left: 24px;
    transition: opacity 1s ease 0.5s;
    opacity: 0;

    &.animate {
      opacity: 1;
    }
  }
}

@keyframes dash {
  to {
    stroke-dashoffset: 0;
  }
}
</style>
