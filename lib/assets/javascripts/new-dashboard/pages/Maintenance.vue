<template>
  <Page>
    <div class="container maintenance-container">
      <div class="maintenance-icon">
        <img src="../assets/icons/common/wrench.svg" />
      </div>
      <h2 class="maintenance-title title is-title is-txtDarkBlue is-bold">{{ $t('MaintenancePage.title') }}</h2>
      <p class="text is-body is-txtDarkBlue">{{ $t('MaintenancePage.text') }}</p>
    </div>
  </Page>
</template>

<script>
import Page from 'new-dashboard/components/Page';

export default {
  name: 'Maintenance',
  components: {
    Page
  }
};
</script>

<style scoped lang="scss">

.maintenance-container {
  text-align: center;
}

.maintenance-icon {
  margin-bottom: 48px;
}

.maintenance-title {
  margin-bottom: 16px;
}
</style>
