<template>
  <div id="nav" class="nav-tabs u-mb--12">
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'NavigationTabs'
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.nav-tabs {
  border-bottom: 1px solid $neutral--300;

  & > a {
    display: inline-block;
    margin-right: 48px;
    padding: 24px 0;
    color: $color-primary;
    font-family: $title__font-family;
    font-size: 12px;
    font-weight: 600;
    line-height: 16px;

    &.router-link-exact-active {
      border-bottom: 4px solid $neutral--800;
      color: $neutral--800;
      pointer-events: none;
    }

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
