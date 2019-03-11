<template>
  <section class="page">
    <ExpirationMessage :expirationDays="expirationDays" :addPaymentsURL="addPaymentsURL"></ExpirationMessage>
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
      addPaymentsURL: window.payments_url
    };
  }
};
</script>
