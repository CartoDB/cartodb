<template>
  <router-link :to="{ name: 'maps' }" class="action-link title is-small">
    {{ text }}
  </router-link>
</template>

<script>
import CreateMapCard from 'new-dashboard/components/CreateMapCard.vue';
import MapCard from 'new-dashboard/components/MapCard.vue';
import MapCardFake from 'new-dashboard/components/MapCardFake.vue';

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
  margin: 64px 0;
  text-align: center;
  text-transform: uppercase;
}
</style>

