<template>
  <div id="app">
    <TrialExpiredPage />
    <Footer />
  </div>
</template>

<script>
import TrialExpiredPage from 'new-dashboard/pages/TrialExpired';
import Footer from 'new-dashboard/components/Footer';

export default {
  name: 'LockoutApp',
  components: {
    TrialExpiredPage,
    Footer
  }
};
</script>
