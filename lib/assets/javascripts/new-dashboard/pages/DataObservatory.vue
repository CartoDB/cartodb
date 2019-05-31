<template>
  <Page class="page--data">
    <DataSecondaryNavigation></DataSecondaryNavigation>
    <section class="section section--noBorder">
      <DataObservatoryList></DataObservatoryList>
    </section>
  </Page>
</template>

<script>
import Page from 'new-dashboard/components/Page';
import DataSecondaryNavigation from 'new-dashboard/components/NavigationBar/DataSecondaryNavigation.vue';
import DataObservatoryList from 'new-dashboard/components/DataObservatoryList.vue';

export default {
  name: 'DataObservatoryPage',
  components: {
    DataSecondaryNavigation,
    Page,
    DataObservatoryList
  }
};
</script>
<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.page.page--data {
  padding: 64px 0 0;
}

.subnavbar-elementItem {
  margin-left: 28px;
  text-decoration: none;

  &.is-active {
    position: relative;
    color: #2E3C43;

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
