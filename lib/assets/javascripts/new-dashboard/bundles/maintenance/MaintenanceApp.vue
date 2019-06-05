<template>
  <div id="app">
    <Maintenance />
    <Footer :user="user"/>
  </div>
</template>

<script>
import Maintenance from 'new-dashboard/pages/Maintenance';
import Footer from 'new-dashboard/components/Footer';

export default {
  name: 'MaintenanceApp',
  components: {
    Maintenance,
    Footer
  },
  computed: {
    user () {
      return this.$store.state.user;
    }
  }
};
</script>
