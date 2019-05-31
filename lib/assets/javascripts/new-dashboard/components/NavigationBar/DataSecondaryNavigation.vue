<template>
  <SecondaryNavigation leftText="Data">
    <template slot="buttons">
      <router-link :to="{ name: 'datasets' }" class="subnavbar-elementItem" exact-active-class="is-active" staticRoute="/dashboard/datasets">
        <span class="title is-small">Your Data</span>
      </router-link>
      <router-link :to="{ name: 'dataObservatory' }" class="subnavbar-elementItem" active-class="is-active" staticRoute="/dashboard/datasets/data-observatory">
        <span class="title is-small">Location Data Streams</span>
      </router-link>
    </template>
  </SecondaryNavigation>
</template>

<script>
import SecondaryNavigation from 'new-dashboard/components/NavigationBar/SecondaryNavigation.vue';

export default {
  name: 'DataObservatoryPage',
  components: {
    SecondaryNavigation
  }
};
</script>
<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.subnavbar-elementItem {
  margin-left: 28px;
  text-decoration: none;

  &.is-active {
    position: relative;
    color: $neutral--800;

    &::after {
      content: "";
      position: absolute;
      bottom: -24px;
      left: 0;
      width: 100%;
      height: 4px;
      background-color: currentColor;
    }
  }
}
</style>
