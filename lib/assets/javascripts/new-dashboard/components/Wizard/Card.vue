<template>
  <div class="u-flex card-container">
    <slot></slot>
    <div class="u-flex u-ml--24  u-flex__direction--column u-flex__justify--between u-flex__grow--1">
      <div class="u-flex u-flex__direction--column">
        <h3 class="title is-caption u-mb--8">{{content.title}}</h3>
        <p class="text is-caption u-mb--8">{{content.subtitle}}</p>
      </div>
      <div class="u-flex u-flex__justify--end">
        <a :href="content.link" target="_blank" class="button button--ghost button--outline">{{content.button}}</a>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Card',
  props: {
    content: Object
  }
};
</script>
<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.card-container {
  height: 180px;
  padding: 24px;
  border: 1px solid #DDD;
}
</style>
