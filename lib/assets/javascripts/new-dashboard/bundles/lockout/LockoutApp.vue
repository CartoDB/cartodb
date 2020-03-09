<template>
  <div id="app">
    <DummyHeader />
    <TrialExpiredPage />
    <Footer :user="user"/>
  </div>
</template>

<script>
import TrialExpiredPage from 'new-dashboard/pages/TrialExpired';
import DummyHeader from 'new-dashboard/components/DummyHeader';
import Footer from 'new-dashboard/components/Footer';

export default {
  name: 'LockoutApp',
  components: {
    TrialExpiredPage,
    DummyHeader,
    Footer
  },
  computed: {
    user () {
      return this.$store.state.user;
    }
  }
};
</script>
