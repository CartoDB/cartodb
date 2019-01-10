<template>
  <section class="page">
    <ExpirationMessage :expirationDays="expirationDays" :upgradeURL="upgradeURL"></ExpirationMessage>
  </section>
</template>

<script>
import ExpirationMessage from 'new-dashboard/components/TrialExpired/ExpirationMessage';

export default {
  name: 'TrialExpired',
  components: {
    ExpirationMessage
  },
  data () {
    return {
      expirationDays: window.expiration_days,
      upgradeURL: window.upgrade_url
    };
  }
};
</script>
