<template>
  <div class="quota-container">
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'QuotaCard'
};
</script>

<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';

.quota-container {
  height: 100%;
  padding: 24px;
  border: 1px solid $light-grey;
  border-radius: 2px;
  background-color: $white;
}
</style>
