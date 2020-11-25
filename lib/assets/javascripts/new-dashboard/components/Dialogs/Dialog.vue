<template>
  <div class="Dialog is-white">
    <button class="CDB-Shape Dialog-closeBtn" @click="close">
      <div class="CDB-Shape-close is-blue is-huge"></div>
    </button>
    <div class="Dialog-contentWrapper Dialog-contentWrapper--withHeaderWrapper">
      <div class="Dialog-header CreateDialog-header with-separator">
        <img class="u-mb--12" height="36" :src="headerImage">
        <h2 class="CDB-Text CDB-Size-large u-mainTextColor">{{headerTitle}}</h2>
      </div>
      <div class="Dialog-body Dialog-body--expanded Dialog-body--create Dialog-body--noPaddingTop Dialog-body--withoutBorder Dialog-body--no-spacing">
        <div class="container grid">
          <div class="grid-cell grid-cell--col12">
            <slot />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>

export default {
  name: 'Dialog',
  components: {},
  props: {
    headerTitle: String,
    headerImage: String
  },
  computed: {},
  methods: {
    close () {
      this.$emit('close');
    }
  }
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
