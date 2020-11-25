<template>
  <div class="Dialog-header CreateDialog-header with-separator">
    <img class="u-mb--12" height="36" :src="image">
    <h2 class="CDB-Text CDB-Size-large u-mainTextColor">{{title}}</h2>
  </div>
</template>
<script>

export default {
  name: 'DialogHeader',
  components: {},
  props: {
    title: String,
    image: String
  },
  computed: {},
  methods: {}
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";
.Dialog-header {
  width: 100%;
  min-height: 0 !important;
  padding: 32px 0;
}
</style>
