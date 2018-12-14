<template>
  <router-link :to="{ name: 'maps' }" class="action-link title is-small">
    {{ text }}
  </router-link>
</template>

<script>
export default {
  name: 'MapsLink',
  props: {
    text: String
  }
};
</script>

<style scoped lang="scss">
@import "stylesheets/new-dashboard/variables";

.action-link {
  display: block;
  margin-top: 28px;
  letter-spacing: 1px;
  text-align: center;
  text-transform: uppercase;
}
</style>
