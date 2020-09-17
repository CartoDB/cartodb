<template>
  <section class="page">
    <slot />
  </section>
</template>

<script>

export default {
  name: 'Page'
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.page {
  position: relative;
  min-height: calc(100vh - 392px);
  padding: 64px 0 120px;
  border-bottom: 1px solid $border-color;

  &--welcome,
  &--settings,
  &--data,
  &--maps {
    padding-top: 0;
  }
}

.page.page__sticky-subheader {
  padding: $subheader__height + 64px 0 120px;
}
</style>
