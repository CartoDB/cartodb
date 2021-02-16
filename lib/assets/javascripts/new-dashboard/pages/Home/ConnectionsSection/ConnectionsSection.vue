<template>
  <section>
    <Connections :home="true" @newConnectionClicked="onNewConnectionClicked"/>
  </section>
</template>

<script>
import Connections from 'new-dashboard/pages/Data/Connections/Connections.vue';

export default {
  name: 'ConnectionsSection',
  components: {
    Connections
  },
  data () {
    return {
    };
  },
  computed: {

  },
  methods: {
    onNewConnectionClicked () {
      this.$emit('newConnectionClicked');
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";
</style>
