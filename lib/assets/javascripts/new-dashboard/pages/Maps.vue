<template>
  <section>
    <h1>Maps Page</h1>
    <CreateButton visualizationType="maps" />
  </section>
</template>

<script>
import CreateButton from 'new-dashboard/components/CreateButton.vue';

export default {
  name: 'MapsPage',
  components: {
    CreateButton
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
</style>
