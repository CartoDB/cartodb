<template>
  <section>
    <div class="container warning-container">
      <div class="warning-icon">
        <img src="../../assets/icons/expired-trial/warning-icon.svg" />
      </div>
      <h2 class="warning-title title is-title is-txtDarkBlue is-bold">
        {{ $t('TrialExpired.ExpirationMessage.title') }}
      </h2>
      <p class="warning-description text is-body is-txtDarkBlue"
          v-html="$t('TrialExpired.ExpirationMessage.description', { expirationDate: humanReadableExpirationDate })">
      </p>
      <div class="buttons-container">
        <a :href="upgradeURL" class="button upgrade-button is-caption">
          {{ $t('TrialExpired.ExpirationMessage.actions.upgrade') }}
        </a>
        <a href="mailto:sales@carto.com" class="button button--ghost is-txtDarkBlue is-caption">
          {{ $t('TrialExpired.ExpirationMessage.actions.contactSales') }}
        </a>
      </div>
    </div>
  </section>
</template>

<script>
import format from 'date-fns/format';

export default {
  name: 'ExpirationMessage',
  data () {
    return {
      expirationDays: window.expiration_days
    };
  },
  computed: {
    humanReadableExpirationDate () {
      return format(this.$store.state.user.trial_ends_at, 'MMMM DD, YYYY');
    },
    upgradeURL () {
      return window.upgrade_url;
    }
  }
};
</script>

<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';

.upgrade-button {
  margin-right: 64px;
  background-color: $text-color-dark;
}

.link {
  text-decoration: underline;
}

.warning-container {
  text-align: center;
}

.warning-icon {
  margin-bottom: 48px;
}

.warning-title {
  margin-bottom: 16px;
  color: $text-color-dark;
}

.warning-description {
  margin-bottom: 16px;
}

.buttons-container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 36px;
}
</style>
