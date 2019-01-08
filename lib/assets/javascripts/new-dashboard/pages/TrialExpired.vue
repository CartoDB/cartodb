<template>
  <section class="page">
    <ExpirationMessage></ExpirationMessage>
  </section>
</template>

<script>
import ExpirationMessage from 'new-dashboard/components/TrialExpired/ExpirationMessage';

export default {
  name: 'TrialExpired',
  components: {
    ExpirationMessage
  }
};
</script>
