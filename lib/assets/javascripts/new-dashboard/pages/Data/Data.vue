<template>
  <Page  class="page--data">
    <SecondaryNavigation></SecondaryNavigation>
    <router-view></router-view>
  </Page>
</template>

<script>
import Page from 'new-dashboard/components/Page';
import SecondaryNavigation from 'new-dashboard/pages/Data/SecondaryNavigation';

export default {
  name: 'DataPage',
  components: {
    Page,
    SecondaryNavigation
  }
}
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";

.page--data {
  padding-top: 64px;
}
</style>