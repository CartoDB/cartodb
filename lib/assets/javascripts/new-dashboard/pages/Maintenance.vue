<template>
  <Page>
    <section>
      <div class="container warning-container">
        <div class="warning-icon">
          <img src="../assets/icons/expired-trial/warning-icon.svg" />
        </div>
        <h2 class="warning-title title is-title is-txtDarkBlue is-bold">
          Sorry
        </h2>
        <p class="text is-body is-txtDarkBlue">
          We're down for scheduled maintenance
        </p>
      </div>
    </section>
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
@import 'new-dashboard/styles/variables';

.warning-container {
  text-align: center;
}

.warning-icon {
  margin-bottom: 48px;
}

.warning-title {
  margin-bottom: 16px;
}
</style>
