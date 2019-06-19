<template>
  <div id="app">
    <DummyHeader />
    <Maintenance />
  </div>
</template>

<script>
import Maintenance from 'new-dashboard/pages/Maintenance';
import DummyHeader from 'new-dashboard/components/DummyHeader';

export default {
  name: 'MaintenanceApp',
  components: {
    Maintenance,
    DummyHeader
  }
};
</script>
