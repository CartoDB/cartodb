<template>
  <div id="app">
    <DummyHeader />
    <Maintenance />
    <DummyFooter />
  </div>
</template>

<script>
import Maintenance from 'new-dashboard/pages/Maintenance';
import DummyHeader from 'new-dashboard/components/DummyHeader';
import DummyFooter from 'new-dashboard/components/DummyFooter';

export default {
  name: 'MaintenanceApp',
  components: {
    Maintenance,
    DummyHeader,
    DummyFooter
  }
};
</script>
