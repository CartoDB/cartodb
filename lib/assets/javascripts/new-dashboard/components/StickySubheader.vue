<template>
  <section class="sticky-subheader" :class="{ 'is-visible': $props.isVisible }">
    <div class="container subheader-container">
      <slot />
    </div>
  </section>
</template>

<script>
export default {
  name: 'StickySubheader',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.sticky-subheader {
  display: flex;
  position: fixed;
  z-index: $z-index__subheader;
  top: 0;
  left: 0;
  justify-content: center;
  width: 100%;
  height: 64px;
  transition: transform 200ms cubic-bezier(0.4, 0.01, 0.165, 0.99);
  border-bottom: 1px solid $grey;
  background-color: $white;

  &.is-visible {
    transform: translate3d(0, 64px, 0);
  }
}

.subheader-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0 20px;
}
</style>
