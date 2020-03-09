<template>
  <Page>
    <ExpirationMessage :expirationDays="expirationDays" :addPaymentsURL="addPaymentsURL"></ExpirationMessage>
  </Page>
</template>

<script>
import Page from 'new-dashboard/components/Page';
import ExpirationMessage from 'new-dashboard/components/TrialExpired/ExpirationMessage';

export default {
  name: 'TrialExpired',
  components: {
    Page,
    ExpirationMessage
  },
  data () {
    return {
      addPaymentsURL: window.payments_url,
      expirationDays: window.expiration_days
    };
  }
};
</script>
