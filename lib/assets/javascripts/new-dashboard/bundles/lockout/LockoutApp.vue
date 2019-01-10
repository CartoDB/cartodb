<template>
  <div id="app">
    <TrialExpiredPage />
    <Footer :user="user"/>
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
  },
  computed: {
    user () {
      return this.$store.state.user;
    }
  }
};
</script>
