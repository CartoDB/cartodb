<template>
  <div id="app">
    <DummyHeader />
    <Maintenance />
    <Footer :user="user"/>
  </div>
</template>

<script>
import Maintenance from 'new-dashboard/pages/Maintenance';
import DummyHeader from 'new-dashboard/components/DummyHeader';
import Footer from 'new-dashboard/components/Footer';

export default {
  name: 'MaintenanceApp',
  components: {
    Maintenance,
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
