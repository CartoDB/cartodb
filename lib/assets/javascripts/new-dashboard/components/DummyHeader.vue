<template>
  <header class="dummy-header">
    <a href="https://carto.com">
      <img svg-inline src="../assets/icons/common/cartoLogo-white.svg" />
    </a>
  </header>
</template>

<script>
export default {
  name: 'DummyHeader'
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.dummy-header {
  display: flex;
  align-items: center;
  height: 60px;
  padding: 0 64px;
  background-color: $primary-color;

  @media (max-width: $layout-tablet) {
    padding: 0 24px;
  }

  @media (max-width: $layout-mobile) {
    padding: 0 16px;
  }
}
</style>
