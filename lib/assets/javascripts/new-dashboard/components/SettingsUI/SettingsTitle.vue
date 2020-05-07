<template>
  <header class="settingsTitle">
    <aside><slot name="pretitle" /></aside>
    <h1 class="settingsTitle__title">{{ title }}</h1>
    <aside class="actions"><slot name="actions" /></aside>
  </header>
</template>

<script>
export default {
  name: 'SettingsTitle',
  props: {
    title: String
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.settingsTitle {
  display: flex;
  align-items: center;
  border-bottom: 1px solid $settings_border-color;
  padding: 20px 0;
}

.settingsTitle__title {
  flex: 1 0 auto;
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
}
</style>
